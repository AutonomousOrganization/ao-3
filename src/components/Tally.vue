<template lang='pug'>

.tally.tooltip
    span
        span(v-if='cardStart').points {{ cardStart.days.toFixed(1) }} days
        span.hide(v-if='b.claimed.length > 0') -
        img(v-for='n in clm.xmark'  src='../assets/images/xmark.svg')
        img(v-for='n in clm.mark'  src='../assets/images/mark.svg')
</template>

<script>

import Current from './Current'

export default {
    props: ['b'],
    components: { Current },
    methods:{
      setAction(){
          if (this.$store.getters.member.action === this.b.taskId){
              return this.$store.dispatch("makeEvent", {
                  type: 'member-field-updated',
                  field: 'action',
                  newfield: false,
                  memberId: this.$store.getters.member.memberId,
              })
          }

          this.$store.dispatch("makeEvent", {
              type: 'member-field-updated',
              field: 'action',
              newfield: this.b.taskId,
              memberId: this.$store.getters.member.memberId,
          })
      },
    },
    computed: {
      actions(){
          let a = []
          this.$store.state.members.forEach(m => {
              if (m.action ===this.b.taskId) a.push(m.memberId)
          })
          return a
      },
      clm(){
          let mark = 0
          let xmark = 0
          let m = this.b.claims.length
          while (m >= 10){
              xmark += 1
              m -= 10
          }
          mark = m
          return {
              mark,
              xmark,
          }
      },
      cardStart(){
          if ( this.b.book.startTs ){
            let now = Date.now()
            let msTill = this.b.book.startTs - now
            let days = msTill / (1000 * 60 * 60 * 24)
            let hours = 0
            let minutes = 0
            return {
                days,
                hours,
                minutes
            }
          }
          return undefined
      },
    }
}

</script>

<style lang='stylus' scoped>

.faded
    opacity: 0.235654

.hide
    opacity: 0
.tally
    padding-right: 0.5em
    padding-left: 0.5em
    font-size: 1em
    min-height: 2em
    min-width: 7em
img
    height: 1em
    position: relative
    bottom: 0
    right: 0

.block
    display: block
    clear: both

img.chest
    display: inline

.points
    position: relative
    top: -0.25em
    margin-right: 0.25em


</style>
