class API {
    async checkForLogins(){
        const  URLS_TO_CLICK = await fetch("/auth")
        return URLS_TO_CLICK
    }
}

export default API