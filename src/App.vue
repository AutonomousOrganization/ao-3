<template lang='pug'>

.app
  auth(v-if='!$store.getters.isLoggedIn')
  router-view(v-else)
</template>

<script>

import Auth from './components/Auth'

export default {
    mounted() {
        let token = window.localStorage.token
        let session = window.localStorage.session
        if (token && session){
            this.$store.commit('setAuth', {token, session})
            this.$store.dispatch('loadCurrent')
        }
        window.addEventListener('keypress', this.alwaysFocus)
    },
    components: {
        Auth
    },
    methods: {
        alwaysFocus(anypass){
            if (anypass.target.id === "card"){
                return // already focused
            }
            this.$store.commit('focus', anypass.key)
        }
    }
}

</script>

<style lang="stylus">
@import "./styles/normalize";
@import "./styles/colours";

.app
    background: #404040
    color: main
    font-size: 1.12334455em
    font-family: ubuntu
    min-height: 100vh

</style>
