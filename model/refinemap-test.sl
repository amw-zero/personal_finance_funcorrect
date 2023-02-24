def genString():
  tsMethodCall("fc", "string", [])
end

def genInt():
  tsMethodCall("fc", "integer", [])
end

def genFloat():
  tsMethodCall("fc", "float", [])
end

def genVariantCaseAttr(attr: TypedAttribute):
  tsObjectProp(attr.name, genType(attr.type))
end

def genVariantCase(vc: VariantCase):
  tsMethodCall("fc", "record", [
    tsObject(vc.attrs.map(genVariantCaseAttr).append(tsObjectProp("type", tsString(vc.name))))
  ])
end

def genVariant(name: String, cases: VariantCaseList):
  tsMethodCall("fc", "oneof", cases.map(genVariantCase))
end

def genGeneric(name: String, types: Array(Type)):
  case name:
    | "Set": tsMethodCall("fc", "uniqueArray", [genType(types.index(0))])
  end
end

def genType(type: Type):
  case type:
    | Schema(s): genSchemaValue(s)
    | Variant(name, cases): genVariant(name, cases)
    | Generic(name, types): genGeneric(name, types)
    | String(): genString()
    | Int(): genInt()
    | Decimal(): genFloat()
  end
end

def genTypeValueObjProp(attr: TypedAttribute):
  tsObjectProp(attr.name, genType(attr.type))
end

def genSchemaValue(s: Schema):
  tsMethodCall(
    "fc",
    "record",
    [tsObject(s.attributes.map(genTypeValueObjProp))]
  )
end

def toTestValue(attr: TypedAttribute):
  case attr.type:
    | Schema(s): tsLet(attr.name, genSchemaValue(s))
    | String(): tsLet(attr.name, genString())
    | Generic(name, types): tsLet(attr.name, genGeneric(name, types))
    | Int(): tsLet(attr.name, genInt())
    | Decimal(): tsLet(attr.name, genFloat())
  end
end

def genTypeName(type: Type):
  case type:
    | Schema(s): s.name
  end
end

def castGenericToModel(name: String, types: Set(Type)):
  case name:
    | "Set": genTypeName(types.index(0)).appendStr("Model[]")
  end
end

def modelTypeCast(type: Type):
  case type:
    | Schema(s): s.name.appendStr("Model")
    | Generic(name, types): castGenericToModel(name, types)
    | Int(): "number"
    | String(): "string"
  end
end

def toCallValue(arg: TypedAttribute):
  tsIden("state.".appendStr(arg.name))
end

def toModelCallValue(arg: TypedAttribute):
  let toUnknown = tsCast(tsIden("state.".appendStr(arg.name)), "unknown")
  
  tsCast(toUnknown, modelTypeCast(arg.type))
end

def actionStateTypeName(actionName: String):
  actionName.appendStr("State")
end

def toTsTypedAttr(attr: TypedAttr):
  tsTypedAttr(attr.name, attr.type)
end

def actionState(action: Action):
  action.args.concat(action.stateVars)
end

def toActionStateType(action: Action):
  tsInterface(actionStateTypeName(action.name),
    actionState(action).map(toTsTypedAttr))
end

def toStateProp(attr: TypedAttribute):
  tsObjectProp(attr.name, tsIden(attr.name))
end

def toClientModelSetup(attr: TypedAttr):
  tsAssignment(
    tsIden("clientModel.".appendStr(attr.name)), tsIden("state.".appendStr(attr.name))
  )
end

def defaultGeneric(s: String):
  case s:
    | "Set": []
  end
end

def toDefaultValue(attr: TypedAttr):
  case attr.type:
    | Generic(name, _types): defaultGeneric(name)
    | String(): ""
  end
end

def isCreateAction(action: Action):
  action.name.equalsStr("AddRecurringTransaction")
end

def actionArgs(action: Action):
  def filterId(arg: TypedAttr):
    if arg.name.equalsStr("id"):
      false
    else:
      true
    end
  end

  if isCreateAction(action):
    action.args.filter(filterId)
  else:
    action.args
  end
end

def implActionCall(action: Action):
  tsAwait(tsMethodCall("impl", action.name, actionArgs(action).map(toCallValue)))
end

def modelActionCall(action: Action):
  if isCreateAction(action):
    tsMethodCall("model", action.name, actionArgs(action).map(toModelCallValue).concat([tsIden("impl.client.lastCreatedTxn!.id")]))
  else:
    tsMethodCall("model", action.name, actionArgs(action).map(toModelCallValue))
  end
end

def toActionTest(action: Action):
  let clientName = "client"
  let dataSetup = actionState(action).map(toTestValue)
  let stateSetup = tsLet("state", tsObject(actionState(action).map(toStateProp)))
  let testOperations = [
    tsLet("client", tsNew("Client", [])),
    tsLet("clientModel", tsNew("Budget", Budget.attributes.map(toDefaultValue)))
  ].concat(action.stateVars.map(toClientModelSetup)).concat([
    tsLet("impl", tsNew("Impl", [
      tsIden("state.db"),
      tsIden("client"),
      tsObject([tsObjectProp("clientModel", tsIden("clientModel"))])
    ])),
    tsLet("model", tsNew("Budget", Budget.attributes.map(toDefaultValue))),
    tsLet("cresp", tsAwait(tsMethodCall(clientName, "setup", [tsIden("state.db")]))),
    tsAwait(tsMethodCall("cresp", "arrayBuffer", [])),
    implActionCall(action),
    modelActionCall(action),
    tsAwait(tsMethodCall("client", "teardown", []))
  ])

  let property = [
    tsAwait(
      tsMethodCall("fc", "assert", [
        tsMethodCall("fc", "asyncProperty", [
          tsIden("state"),
          tsClosure(
            [
              tsTypedAttr("state", tsType(actionStateTypeName(action.name)))
            ],
            testOperations,
            true
          )
        ])
      ])
    )
  ]

  let testBody = [dataSetup, [stateSetup], property].flatten()
  let testWrapper = tsClosure([tsTypedAttr("t", tsType("Deno.TestContext"))], testBody, true)
  
  tsMethodCall("Deno", "test", [action.name, testWrapper])
end

def actionTests():
  tsClosure([], Model.actions.map(toActionTest), false)
end

def toSchemaImplImport(schema: Schema):
  tsSymbolImport(schema.name, schema.name)
end

def toName(arg: TypedAttr):
  tsIden(arg.name)
end

def toCastedName(arg: TypedAttr):
  let toUnknown = tsCast(tsIden(arg.name), "unknown")
  
  tsCast(toUnknown, modelTypeCast(arg.type))
end

def isWriteAction(action: Action):
  action.stateVars.length().greaterThan(0)
end

def toModelCallValue(arg: TypedAttribute):
  let toUnknown = tsCast(tsIden("state.".appendStr(arg.name)), "unknown")
  
  tsCast(toUnknown, modelTypeCast(arg.type))
end

def implActionImpl(action: Action):
  if isWriteAction(action):
    if isCreateAction(action):
      [
        tsAwait(tsMethodCall("this.client", action.name, actionArgs(action).map(toName))),
        tsMethodCall("this.aux.clientModel", action.name, actionArgs(action).map(toCastedName).concat([tsIden("this.client.lastCreatedTxn!.id")]))
      ]
    else:
      [
        tsAwait(tsMethodCall("this.client", action.name, actionArgs(action).map(toName))),
        tsMethodCall("this.aux.clientModel", action.name, actionArgs(action).map(toCastedName))
      ]
    end
   
  else:
    [tsAwait(tsMethodCall("this.client", action.name, action.args.map(toName)))]
  end
end

def toImplActionMethod(action: Action):
  let impl = implActionImpl(action)
  tsClassMethod("async ".appendStr(action.name), actionArgs(action), impl, false)
end

def implClass():
  tsClass("Impl", [
    tsClassProp("db", tsType("DBState")),
    tsClassProp("client", tsType("Client")),
    tsClassProp("aux", tsType("AuxiliaryVariables")),
    tsClassMethod("constructor", [
      tsTypedAttr("db", tsType("DBState")),
      tsTypedAttr("client", tsType("Client")),
      tsTypedAttr("aux", tsType("AuxiliaryVariables"))
    ], [
      tsAssignment(tsIden("this.db"), tsIden("db")),
      tsAssignment(tsIden("this.client"), tsIden("client")),
      tsAssignment(tsIden("this.aux"), tsIden("aux"))
    ], false)
  ].concat(Model.actions.map(toImplActionMethod)))
end

def toSchemaModelImport(schema: Schema):
  tsSymbolImport(schema.name, schema.name.appendStr("Model"))
end

def imports():
  [
    tsAliasImport(
      Model.schemas.map(toSchemaImplImport)
        .append(tsSymbolImport("Client", "Client"))
        .append(tsSymbolImport("DBState", "DBState")),
      "./react_ui/src/state.ts"
    ),
    tsAliasImport(
      Model.schemas.map(toSchemaModelImport),
      "./model.ts"
    ),
    tsAliasImport([
      tsSymbolImport("Budget", "Budget")
    ], "./model.ts"),
    tsAliasImport(
      [tsSymbolImport("assertEquals", "assertEquals")],
      "https://deno.land/std@0.149.0/testing/asserts.ts"
    ),
    tsDefaultImport("fc", "https://cdn.skypack.dev/fast-check")
  ]
end

typescript:
  {{* imports() }}
  {{* Model.actions.map(toActionStateType) }}
  {{ tsInterface("AuxiliaryVariables", [tsTypedAttr("clientModel", tsType("Budget"))]) }}
  {{ implClass() }}
  {{ tsExport(tsLet("runTests", actionTests())) }}
end
