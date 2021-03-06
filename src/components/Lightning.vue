<template lang='pug'>

#nodes
    .breathing
    .row
        .four.grid(v-if='$store.state.cash.info.mempool')
            .lim(v-if='$store.getters.limbo > 0') limbo  {{ $store.getters.limbo.toLocaleString() }}
            .section block {{ $store.state.cash.info.blockheight.toLocaleString()}}, {{ ((Date.now() - ($store.state.cash.info.blockfo.time * 1000)) / 60 / 1000).toFixed(1) }}min old
            .section fees (sat/byte)
            .section
                .grid
                    .three.grid
                        p 90th
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.blockfo.feerate_percentiles[4])')  {{ $store.state.cash.info.blockfo.feerate_percentiles[4] }}
            .section
                .grid
                    .three.grid
                        p 75th
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.blockfo.feerate_percentiles[3])')  {{ $store.state.cash.info.blockfo.feerate_percentiles[3] }}
            .section
                .grid
                    .three.grid
                        p 50th
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.blockfo.feerate_percentiles[2])')  {{ $store.state.cash.info.blockfo.feerate_percentiles[2] }}
            .section
                .grid
                    .three.grid
                        p 25th
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.blockfo.feerate_percentiles[1])')  {{ $store.state.cash.info.blockfo.feerate_percentiles[1] }}
            .section
                .grid
                    .three.grid
                        p 10th
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.blockfo.feerate_percentiles[0])')  {{ $store.state.cash.info.blockfo.feerate_percentiles[0] }}
            .section
                .grid
                    .three.grid
                        p smart
                    .nine.grid
                        .chain(:class='getFeeColor($store.state.cash.info.mempool.smartFee.feerate * 10000000 / 1000)')  {{ ($store.state.cash.info.mempool.smartFee.feerate * 10000000 / 1000).toFixed() }}
            .section.sampler(@click='sampler') {{ ($store.state.cash.info.mempool.bytes / 1000000).toFixed(1) }} MB unconfirmed
            .section check transaction id:
            input(v-model='txnCheck'  type='text'  placeholder='check txid'  @keypress.enter='checkTxid(txnCheck)')
            button(v-if='txnCheck'  @click='checkTxid(txnCheck)') get transaction
            .chanfo(v-if='fetchedTxn.txid')
                div txid: {{ fetchedTxn.txid }}
                div status: {{ fetchedTxnStatus }}
                div(v-if='fetchedTxn.memPool')
                    .chain(:class='getFeeColor(fetchedTxn.memPool.fee * 100000000 / fetchedTxn.memPool.vsize)') fee: {{ (fetchedTxn.memPool.fee * 100000000 / fetchedTxn.memPool.vsize).toFixed() }}
                template(v-if='fetchedTxn.utxo && fetchedTxn.utxo.length > 0'  v-for='u in fetchedTxn.utxo')
                    div(v-if='u && u.value > 0 && u.scriptPubKey.addresses') {{ u.value }} : {{u.scriptPubKey.addresses}} - unspent
                div(v-for='outp in filteredOut') {{ outp.value }} : {{outp.scriptPubKey.addresses}}
                .chanfo(v-if='showOutputs'  v-for='n in $store.state.cash.info.outputs'  @click='checkTxid(n.txid)') txid: {{n.txid}} : {{n.output}}
        .eight.grid(v-if='$store.state.cash.info.channels')
            .section {{ $store.getters.confirmedBalance.toLocaleString() }} chain
            .section(@click='selectedPeer = false'   :class='{ptr: selectedPeer >= 0}') {{ parseFloat( nn.channel_sat ).toLocaleString() }} local
            .section {{ parseFloat( nn.channel_total_sat - nn.channel_sat ).toLocaleString() }} remote
            .section {{ $store.state.cash.info.channels.length }} channels
            .chanfo(v-if='selectedPeer >= 0 && areChannels && selectedChannel')
                div(v-if='selectedChannel.connected') online
                div(v-else) offline
                div pubkey: {{ selectedChannel.peer_id }}
                div(@click='checkTxid(selectedChannel.funding_txid)') txid: {{ selectedChannel.funding_txid }}
                div(v-if='selectedChannel.state !== "CHANNELD_NORMAL"') state: {{ selectedChannel.state }}
                div
                    div in activity: {{ fetchedPeer.in_payments_fulfilled }} / {{ fetchedPeer.in_payments_offered }}
                    div out activity: {{ fetchedPeer.out_payments_fulfilled }} / {{ fetchedPeer.out_payments_offered }}
            .row.channellimiter
                .chanfo(v-if='selectedPeer < 0') pubkey: {{ $store.state.cash.info.id }}
                .ptr(v-for='(n, i) in $store.state.cash.info.channels' :key='n.peer_id')
                    .localremote(v-show='selectedPeer === i'   @click='selectedPeer = false')
                        .localbar.tall(:style='l(n)'  :class='{abnormal:n.state !== "CHANNELD_NORMAL"}')  {{ parseInt( n.channel_sat ).toLocaleString() }}
                        .remotebar.tall(:style='r(n)'  :class='{abnormal:n.state !== "CHANNELD_NORMAL"}')  {{ parseInt( n.channel_total_sat - n.channel_sat ).toLocaleString() }}
                    .localremote(v-show='selectedPeer !== i'   @click='selectPeer(i)')
                        .localbar(:style='l(n, true)' :class='{abnormal:n.state !== "CHANNELD_NORMAL"}')
                        .remotebar(:style='r(n, true)'  :class='{abnormal:n.state !== "CHANNELD_NORMAL"}')
    .row
        .chanfo(v-if='$store.state.cash.info.address') lightning : {{ $store.state.cash.info.id }}@{{ $store.state.cash.info.address[0].address }}
</template>

<script>
import calculations from '../calculations'

import PointsSet from './PointsSet'

import Tag from './Tag'
import request from 'superagent'

export default {
    data(){
        return {
            showOutputs: false,
            fetchedTxn: {},
            fetchedPeer: {},
            txnCheck: '',
            selectedPeer: false,
            open: false,
            sampleIndex: 0,
        }
    },
    components:{
         Tag, PointsSet
    },
    computed: {
        selectedChannel(){
            return this.$store.state.cash.info.channels[this.selectedPeer]
        },
        filteredOut(){
            if (this.fetchedTxn.utxo){
                let unspents = this.fetchedTxn.utxo.filter(x => x !== null).map(x => x.txid)
                return this.fetchedTxn.vout.filter( y => {
                    return unspents.indexOf(y.txid) === -1
                })
            } else {
                return this.fetchedTxn.vout.filter(() => true)
            }
        },
        fetchedTxnStatus(){
            if (this.fetchedTxn.memPool){
                return 'unconfirmed'
            }
            if (this.fetchedTxn.utxo){
                return 'confirmed, unspent'
            }
            return 'confirmed, spent'
        },
        areChannels(){
            return this.$store.state.cash.info.channels
        },
        sats(){
            return calculations.cadToSats(1, this.$store.state.cash.spot)
        },
        nn(){
            let totals = {
                channel_sat: 0,
                channel_total_sat: 0,
            }
            this.$store.state.cash.info.channels.forEach(n => {
                if (n.state === "CHANNELD_NORMAL"){
                    totals.channel_sat += n.channel_sat
                    totals.channel_total_sat += n.channel_total_sat
                }
            })
            if (totals.channel_sat + totals.channel_total_sat === 0){
                totals.channel_sat = 0
                totals.channel_total_sat = 0
            }
            return totals
        }
    },
    methods:{
        getFeeColor(x){
            if (x > 100) return { high : 1}
            if (x > 50) return { midhigh : 1}
            if (x > 10) return { mid: 1}
            return {low: 1}
        },
        sampler(){
            let checkId = this.$store.state.cash.info.mempool.sampleTxns[this.sampleIndex % this.$store.state.cash.info.mempool.sampleTxns.length]
            this.checkTxid(checkId)
            this.sampleIndex ++
        },
        checkPeer(x){
            console.log('checking ' , x)
            request
                .post('/lightning/peer')
                .send({pubkey: x})
                .set("Authorization", this.$store.state.loader.token)
                .end( (err, res) => {
                    console.log({err,res})
                    if (!err) {
                        this.fetchedPeer = res.body
                    }
                })
        },
        checkTxid(x){
            request
                .post('/bitcoin/transaction')
                .send({txid : x})
                .set("Authorization", this.$store.state.loader.token)
                .end((err, res)=>{
                    if (!err){
                        this.fetchedTxn = res.body
                    }
                })
            this.txnCheck = ''
        },
        toggleOpen(){
            this.open = !this.open
        },
        toggleShowOutputs(){
            this.showOutputs = !this.showOutputs
        },
        selectPeer(pId){
            if (pId === this.selectedPeer){
                return this.selectedPeer = false
            }
            this.selectedPeer = pId
            this.checkPeer(this.selectedChannel.peer_id)
        },
        r(n, nolimits){
            let local = parseFloat( n.channel_sat )
            let remote = parseFloat( n.channel_total_sat - n.channel_sat )

            let capacity = local + remote
            let remotePercent =  remote / capacity

            if (!nolimits && remotePercent < 0.2 && remotePercent > 0) {
                remotePercent = 0.2
            }

            let w = (remotePercent * 100).toFixed(7) + "%"
            return {
                width: w
            }
        },
        l(n, nolimits){
          let local = parseFloat( n.channel_sat )
          let remote = parseFloat( n.channel_total_sat - n.channel_sat )

          let capacity = local + remote
          let localPercent =  n.channel_sat / capacity

          if (!nolimits && localPercent > 0.8 && localPercent < 1) {
              localPercent = 0.8
          }
          let w = (localPercent * 100).toFixed(7) + "%"
          return {
              width: w
          }
        },
    }
}
</script>

<style lang='stylus' scoped>

@import '../styles/colours'
@import '../styles/skeleton'
@import '../styles/grid'
@import '../styles/button'
@import '../styles/input'


.section
    color:main
    font-size: 0.9em
    margin-bottom: .9em
    text-align: left

.chanfo
    word-break: break-all
    overflow-wrap: break-word;
    text-align: left
.ptr
    cursor: pointer

.localbar.tall
    height: 2em
.remotebar.tall
    height: 2em

#nodes
    text-align: center

.inactive
    opacity: 0.3456

.center
    text-align: center
    word-break: break-all
    overflow-wrap: break-word;
    font-size: 0.5em

.center.nowx
    margin-top: 0.3em
    margin-bottom: 0.3em
    height: 2em

.fw
    width: 100%

.container
    content-align: center

h3
    text-align: center

a
    color: purple

h1
    text-align: center

.h
    height: 2em

label
    word-break: break-all

.break
    overflow-wrap: break-word;

#worf
    height: 23em

#palm
    width:110%

.setupyourown
    margin-top: 2.2345em
    padding: 2em
    color: purple
    font-size: 1.12em

.small
    font-size: .68em
    word-break: break-all

p
    text-align: center

.fl
    float: left
.fr
    float: right

.local
    margin: 0
    background: green
    padding: 1em

.remote
    margin: 0
    background: blue
    text-align: right
    padding: 1em

.chain
    height: 1.7em
    margin: 0
    text-align: center
    position: relative
    padding-top: 0.6em
    opacity: 0.8

.outputs
  cursor: pointer

.chain.high
  background: wrexred
.chain.midhigh
  background: wrexyellow
.chain.mid
  background: wrexblue
.chain.low
  background: wrexgreen


.break
    overflow-wrap: break-word;

#worf
    float: right

.lim
  color: black

.block
    float: right
    font-size: .77em

h5
    text-align: center
    color: lightGrey
    opacity: 0.77

.bdoge
    width: 100%
    opacity: 0.77
    height: 5em
    margin-top: 1em

.localremote
    width: 100%
    height: 0.622em

.localbar
    height: 0.622em
    background: green
    float: left

.localbar.abnormal
    background: red

.remotebar
    height: 0.622em
    background: blue
    float: right

.remotebar.abnormal
    background: red

.breathing
    height: 3.5em

.breathing1
    height: 1.35em
.spacer
    padding-top: 3.21em
    margin-bottom: .7654321em
.sampler
    cursor: pointer
.channellimiter
    max-height: 13em
    overflow-y: scroll;
</style>
