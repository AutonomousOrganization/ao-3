<template lang='pug'>

.context.paperwrapper(:class="cardInputSty")
    .popup
        .here
            span.front(v-if='isMember')  {{ isMember }}
            span.front(v-else-if='isResource')  {{ isResource }}
            span.front(v-else-if='card.guild')  {{ card.guild }}
            linky.front(v-else  :x='name'  :key='name')
    img.front(v-if='card.guild'  src="../assets/images/badge.svg")
    img.front(v-if='isMember' src="../assets/images/doge.svg")
    div.right.front(v-if='card.book.startTs')
        tally(:b='card')
    slot
</template>

<script>
import Linky from './Linky'
import Tally from './Tally'

export default {
    props: ['taskId'],
    components: { Linky, Tally },
    computed: {
        isResource(){
            let is = false
            this.$store.state.resources.some(m => {
                if (m.resourceId === this.taskId){
                    is = m.name
                    return true
                }
            })
            return is
        },
        isMember(){
            let is = false
            this.$store.state.members.some(m => {
                if (m.memberId === this.taskId){
                    is = m.name
                    return true
                }
            })
            return is
        },
        name(){
            return this.card.name
        },
        card(){
            return this.$store.state.tasks[this.$store.state.hashMap[this.taskId]]
        },
        cardStart(){
            if ( this.card.book.startTs ){
              let now = Date.now()
              let msTill = this.card.book.startTs - now
              // XXX TODO
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
        cardInputSty() {
          if (this.$store.getters.member.stacks === 1){
              return {
                  nowx: true
              }
          }
          let color = this.card.color
          return {
              redwx : color == 'red',
              bluewx : color == 'blue',
              greenwx : color == 'green',
              yellowwx : color == 'yellow',
              purplewx : color == 'purple',
              blackwx : color == 'black',
          }
        },
        cardAge(){
            let now = Date.now()
            let msSince = now - this.card.timestamp
            let days = msSince / (1000 * 60 * 60 * 24)
            return days
        },
    },
}

</script>

<style lang='stylus' scoped>

@import '../styles/colours'

img
    height: 1.1em
    float: left
    padding-left: 1em

.context
    opacity: 0.9

    width: calc(100% + 1em)

.paperwrapper
    position: relative
    z-index: 1

.hyperpaper
    background-image: url('/paper.jpg')
    background-repeat: no-repeat
    background-position: center center
    background-size: cover
    top: 0
    left: 0
    bottom: 0
    right: 0
    position: absolute
    width: 100%
    opacity: 0.2
    z-index: 2
    position: absolute

.freshpaper
    background-image: url('/paper.jpg')
    opacity: 0.2

.weekoldpaper
    background-image: url('/paper_aged_1.png')
    opacity: 0.25

.montholdpaper
    background-image: url('/paper_aged_2.png')
    opacity: 0.3

.threemontholdpaper
    background-image: url('/paper_aged_3.png')
    opacity: 0.35

.popup
    top: 0
    left: 0
    bottom: 0
    right: 0
    position: relative
    width: 100%
    height: 1.5em
    cursor: pointer
    z-index: 50
    overflow: hidden

.popup .here
    // visibility: hidden
    opacity: 0.15

.here
    position: inline

    pointer-events: none
    margin-left: 2.5em

img.front
    position: absolute
    top: 0.2em
    left: -0.5em

.right.front
    position: absolute
    top: 0.2em
    right: 0.5em

.right.front img
    margin-right: 0.5em
    margin-left: 0.15em

.front
    z-index: 100
    position: relative
    pointer-events: none

.right.front
    float: right

.context
    box-shadow: -7px -7px 7px 1px rgba(21, 21, 21, 0.5)
</style>
