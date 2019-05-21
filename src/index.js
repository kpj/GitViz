import Vue from 'vue'
import Vuex from 'vuex'

import { createVisualization } from './visualization'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    repoUrl: 'https://github.com/kpj/GitViz',
    inSetupState: true
  },
  mutations: {
    repoUrl: (state, value) => {
      state.repoUrl = value
    },
    finishSetup: state => {
      state.inSetupState = false
    }
  }
})

const SetupDialog = {
  template: `
    <div id="setup">
      <input v-model="repoUrl" size=100></input>
      <button v-on:click="parseRepo">Parse repository</button>
    </div>
  `,
  computed: {
    repoUrl: {
      get () {
        return this.$store.state.repoUrl
      },
      set (value) {
        this.$store.commit('repoUrl', value)
      }
    }
  },
  methods: {
    parseRepo: function () {
      this.$store.commit('finishSetup')
      createVisualization(store.state)
    }
  }
}

const NetworkView = {
  template: `
    <div>
      <div id="header"></div>
      <div id="container"></div>
    </div>
  `
}

const app = new Vue({
  el: '#app',
  store,
  components: { SetupDialog, NetworkView },
  template: `
    <div>
      <SetupDialog v-if="inSetupState"></SetupDialog>
      <NetworkView v-if="!inSetupState"></NetworkView>
    </div>
  `,
  computed: {
    inSetupState: {
      get () {
        return this.$store.state.inSetupState
      },
      set (value) {
        this.$store.commit('finishSetup')
      }
    }
  }
})
