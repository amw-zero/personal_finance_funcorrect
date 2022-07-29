theory RefineDet

imports Main

begin

section "Process definition. A process represents the computation of a program"

record ('event, 'state, 'external) process =
  Init :: "'external \<Rightarrow> 'state"
  Step :: "'event \<Rightarrow> 'state \<Rightarrow> 'state"
  Fin :: "'state \<Rightarrow> 'external"

definition "steps f s events \<equiv> foldl (\<lambda> result event. f event result) s events"

definition "exec proc s events \<equiv> (Fin proc) (steps (Step proc) (Init proc s) events)"

section "A model process that simply increments or decrements an integer, and supports viewing it"

datatype E = View | Inc | Dec

definition step :: "E \<Rightarrow> int \<Rightarrow> int" where
"step e i = (case e of Inc \<Rightarrow> i + 1 | Dec \<Rightarrow> i - 1)"

definition id :: "'a \<Rightarrow> 'a" where
"id i = i"

definition "Model \<equiv> \<lparr> Init = id, Step = step, Fin = id \<rparr>"

section "An implementation process that has a full-stack web app architecture, with client, server,
         and application state."

datatype ClientE =
    ReqInt
  | RecvInt int

record ClientState =
  val :: int
  loading :: bool

definition step_c :: "ClientE \<Rightarrow> ClientState \<Rightarrow> ClientState" where
"step_c e s =
 (case e of
    ReqInt \<Rightarrow> s\<lparr> loading := True \<rparr> 
  | RecvInt i \<Rightarrow> s\<lparr> loading := False, val := i \<rparr>)"

definition "Client \<equiv> \<lparr> Init = id, Step = step_c, Fin = id \<rparr>"

type_synonym AppState = "(string \<Rightarrow> int)"

record ServerResponse =
  state :: AppState
  response :: int

type_synonym ClientType = "\<lparr> Init :: ClientState \<Rightarrow> ClientState,
  Step :: ClientE \<Rightarrow> ClientState \<Rightarrow> ClientState,
  Fin :: ClientState \<Rightarrow> ClientState \<rparr>"

record App = 
  client :: ClientType
  client_state :: ClientState
  app_state :: AppState
  server :: "E \<Rightarrow> AppState \<Rightarrow> ServerResponse"

definition app_server :: "E \<Rightarrow> AppState \<Rightarrow> ServerResponse" where
"app_server r s =
  (case r of 
    View \<Rightarrow> \<lparr> state = s, response = (s ''curr_int'') \<rparr>
  | Inc \<Rightarrow> 
    (let curr = s(''curr_int'') in
    let incd = curr + 1 in
      \<lparr> state = s(''curr_int'' := incd), response = incd \<rparr>)
  | Dec \<Rightarrow>
    (let curr = s(''curr_int'') in
    let decd = curr - 1 in
      \<lparr> state = s(''curr_int'' := decd), response = decd \<rparr>)
  )"

definition client_exec :: "E \<Rightarrow> App \<Rightarrow> App" where
"client_exec e a = (let c = client a in
         let fetching = exec c (client_state a) [ReqInt] in 
         let curr_state = app_state a in
         let resp = (server a) e (app_state a) in
         let received = exec c fetching [RecvInt ((state resp) ''curr_int'')] in
           a\<lparr> client_state := received, app_state := state resp \<rparr>)"

definition step_i :: "E \<Rightarrow> App \<Rightarrow> App" where
"step_i e a = 
  (case e of 
  Inc => client_exec e a |
  Dec \<Rightarrow> client_exec e a)"

definition init_i :: "int \<Rightarrow> App" where
"init_i i = \<lparr> client = Client, client_state = \<lparr> val = i, loading = False \<rparr>, app_state = (\<lambda> s. i), server = app_server \<rparr>"

definition fin_i :: "App \<Rightarrow> int" where
"fin_i a = (if (loading (client_state a)) = False then (val (client_state a)) else -1)"

definition "Impl \<equiv> \<lparr> Init = init_i, Step = step_i, Fin = fin_i \<rparr>"

value "step Inc 1"

value "steps step 0 [Inc, Inc, Dec, Dec]"

value "exec Model 0 [Inc, Inc]"

value "exec Impl 0 [Inc, Inc]"

value "exec Model (-2) [Dec]"

value "exec Impl (-2) [Dec]"

definition "back_sim S I s events out \<equiv> 
  exec I s events = out \<longrightarrow> exec S s events = out"

definition "fw_sim S I s events out \<equiv> 
  exec S s events = out = exec I s events = out"

definition "bi_sim S I s events \<equiv> 
  exec I s events = exec S s events"

lemma "fin_i (step_i e a) = step e (fin_i a)"
  apply(simp add: fin_i_def step_i_def step_def client_exec_def)
  oops

lemma "bi_sim Model Impl s events"
  apply(simp add: bi_sim_def exec_def steps_def Impl_def Model_def fin_i_def id_def)
  oops

  (*apply(unfold bi_sim_def exec_def steps_def Impl_def Model_def) *)
  (*apply(unfold bi_sim_def exec_def steps_def Impl_def Model_def init_i_def step_i_def fin_i_def id_def step_def client_exec_def)*)

end