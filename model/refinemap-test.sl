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

def toCallValue(arg: TypedAttribute):
  tsIden("state.".appendStr(arg.name))
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

def toActionTest(action: Action):
  let clientName = "client"
  let dataSetup = actionState(action).map(toTestValue)
  let stateSetup = tsLet("state", tsObject(actionState(action).map(toStateProp)))
  let testOperations = [
    tsLet("client", tsNew("Client", [])),
    tsLet("clientModel", tsNew("Budget", []))
  ].concat(action.stateVars.map(toClientModelSetup)).concat([
    tsLet("impl", tsNew("Impl", [
      tsIden("state.db"),
      tsIden("client"),
      tsObject([tsObjectProp("clientModel", tsIden("clientModel"))])
    ])),
    tsLet("model", tsNew("Budget", [])),
    tsLet("cresp", tsAwait(tsMethodCall(clientName, "setup", [tsIden("state.db")]))),
    tsAwait(tsMethodCall("cresp", "arrayBuffer", [])),
    tsAwait(tsMethodCall("impl", action.name, action.args.map(toCallValue))),
    tsMethodCall("model", action.name, action.args.map(toCallValue)),
    tsAwait(tsMethodCall("client", "teardown", []))
  ])

  let property = [
    tsAwait(
      tsMethodCall("fc", "assert", [
        tsMethodCall("fc", "asyncProperty", [
          tsIden("state"),
          tsAsync(
            tsClosure(
              [
                tsTypedAttr("state", tsType(actionStateTypeName(action.name)))
              ],
              testOperations
            )
          )
        ])
      ])
    )
  ]

  let testBody = [dataSetup, [stateSetup], property].flatten()
  let testWrapper = tsClosure([tsTypedAttr("t", tsType("Deno.TestContext"))], testBody).tsAsync()
  
  tsMethodCall("Deno", "test", [action.name, testWrapper])
end

def actionTests():
  tsClosure([], Model.actions.map(toActionTest))
end

def toSchemaImplImport(schema: Schema):
  tsSymbolImport(schema.name, schema.name)
end

def toImplActionMethod(action: Action):
  tsClassMethod("async ".appendStr(action.name), action.args, [])
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
    ])
  ].concat(Model.actions.map(toImplActionMethod)))
end

typescript:
  {{ tsAliasImport(
    Model.schemas.map(toSchemaImplImport)
      .append(tsSymbolImport("Client", "Client"))
      .append(tsSymbolImport("DBState", "DBState")),
    "./react_ui/src/state.ts")
  }}
  {{ tsAliasImport([
    tsSymbolImport("Budget", "Budget")
  ], "./model.ts")
  }}
  {{ tsAliasImport(
    [tsSymbolImport("assertEquals", "assertEquals")],
    "https://deno.land/std@0.149.0/testing/asserts.ts")
  }}
  {{ tsDefaultImport("fc", "https://cdn.skypack.dev/fast-check") }}
  {{* Model.actions.map(toActionStateType) }}
  {{ tsInterface("AuxiliaryVariables", [tsTypedAttr("clientModel", tsType("Budget"))]) }}
  {{ implClass() }}
  {{ tsExport(tsLet("runTests", actionTests())) }}
end
