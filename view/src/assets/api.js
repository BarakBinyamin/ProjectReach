class API {
    static async checkForLogins(){
        const  URLS_TO_CLICK = await (await fetch("/auth", 
            {credentials: "same-origin"})).json()
        return URLS_TO_CLICK
    }
    static async uploadLastPush(){
        const  URLS_TO_CLICK = await (await fetch("/run", 
            {credentials: "same-origin"})).json()
        return URLS_TO_CLICK
    }
}

export default API