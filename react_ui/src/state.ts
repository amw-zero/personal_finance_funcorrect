// State binding for application kernel

// Property: for all transitions, the state bound in the React UI matches the 
// plain object state   

export async function Test() { 
    console.log("React shared");
    
    let resp = await fetch("http://localhost:3000/recurring_transactions")
    
    return resp.json();
}