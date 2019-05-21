import Vue from 'vue'
import Vuex from 'vuex'

import { createVisualization } from './visualization'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    repoUrl: 'https://github.com/kpj/GitViz',
    inSetupState: true,
    iterationDuration: 2000,
    gitBranch: 'master'
  },
  mutations: {
    repoUrl: (state, value) => {
      state.repoUrl = value
    },
    finishSetup: state => {
      state.inSetupState = false
    },
    iterationDuration: (state, value) => {
      state.iterationDuration = value
    },
    gitBranch: (state, value) => {
      state.gitBranch = value
    }
  }
})

const SetupDialog = {
  template: `
    <div id="setup">
      <label>Repository url:</label>
      <input v-model.trim="repoUrl" size=100></input>
      <br>
      <label>Git branch:</label>
      <input v-model.trim="gitBranch"></input>
      <br>
      <label>Iteration duration:</label>
      <input v-model.trim="iterationDuration"></input>
      <br>
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
    },
    iterationDuration: {
      get () {
        return this.$store.state.iterationDuration
      },
      set (value) {
        this.$store.commit('iterationDuration', value)
      }
    },
    gitBranch: {
      get () {
        return this.$store.state.gitBranch
      },
      set (value) {
        this.$store.commit('gitBranch', value)
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
      <div id="header">loading</div>
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
