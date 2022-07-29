theory RefineDet

imports Main

begin

record ('event, 'state, 'external) process =
  Init :: "'external \<Rightarrow> 'state"
  Step :: "'event \<Rightarrow> 'state \<Rightarrow> 'state"
  Fin :: "'state \<Rightarrow> 'external"

definition "steps f s events \<equiv> foldl (\<lambda> result event. f event result) s events"

definition "exec proc s events \<equiv> (Fin proc) (steps (Step proc) (Init proc s) events)"

datatype E = View | Inc | Dec

definition step :: "E \<Rightarrow> int \<Rightarrow> int" where
"step e i = (case e of Inc \<Rightarrow> i + 1 | Dec \<Rightarrow> i - 1)"

definition id :: "int \<Rightarrow> int" where
"id i = i"

definition "Model \<equiv> \<lparr> Init = id, Step = step, Fin = id \<rparr>"

type_synonym AppState = "(string \<Rightarrow> int)"

record ServerResponse =
  state :: AppState
  response :: int
  
record App = 
  client :: int 
  loading :: bool
  app_state :: AppState
  server :: "E \<Rightarrow> AppState \<Rightarrow> ServerResponse"

(*definition "Client \<equiv> \<lparr> Init = id, Step = step_c, Fin = id \<rparr>" *)

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

definition step_i :: "E \<Rightarrow> App \<Rightarrow> App" where
"step_i e a = 
  (case e of 
  Inc => let curr_state = app_state a in
         let fetching_app = a\<lparr> loading := True \<rparr> in
         let resp = (server a) e (app_state a) in
           a\<lparr> client := response resp, loading := False, app_state := state resp \<rparr> |
  Dec \<Rightarrow> a\<lparr> client := 0, loading := False \<rparr>)"

definition init_i :: "int \<Rightarrow> App" where
"init_i i = \<lparr> client = i, loading = False, state = (\<lambda> s. 0), server = app_server \<rparr>"

definition fin_i :: "App \<Rightarrow> int" where
"fin_i as = (if loading as = False then client as else -1)"

definition "Impl \<equiv> \<lparr> Init = init_i, Step = step_i, Fin = fin_i \<rparr>"

value "step Inc 1"

value "steps step 0 [Inc, Inc, Dec, Dec]"

value "exec Model 0 [Inc, Inc]"

definition "back_sim S I s events out \<equiv> 
  exec I s events = out \<longrightarrow> exec S s events = out"

definition "fw_sim S I s events out \<equiv> 
  exec S s events = out = exec I s events = out"

definition "bi_sim S I s events \<equiv> 
  exec I s events = exec S s events"

lemma "bi_sim Model Impl s events"
  oops

end