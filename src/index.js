import Vue from 'vue'
import Vuex from 'vuex'
import VuexForms, { Form } from 'vuex-forms'

import { createVisualization } from './visualization'

import './assets/css/tailwind.css'
import './assets/css/visualization.css'

Vue.use(Vuex)
Vue.use(VuexForms)

const store = new Vuex.Store({
  state: {
    inSetupState: true,
    config: {
      repoUrl: 'https://github.com/kpj/GitViz',
      iterationDuration: 2000,
      gitBranch: 'master'
    },
    commitList: []
  },
  mutations: {
    updateConfig: (state, value) => {
      state.config = value
    },
    finishSetup: state => {
      state.inSetupState = false
    },
    addCommit: (state, value) => {
      state.commitList.push(value)
    }
  }
})

const SetupDialog = {
  data: function () {
    return {
      form: new Form(this, {
        repoUrl: this.$store.state.config.repoUrl,
        gitBranch: this.$store.state.config.gitBranch,
        iterationDuration: this.$store.state.config.iterationDuration
      })
    }
  },
  template: `
    <form name="basic-form" @submit.prevent="form.submit()">
      <vuex-text label="repoUrl:"
                 id="repoUrl"
                 name="repoUrl"
                 v-input-sync:repoUrl="form">
      </vuex-text>

      <vuex-text label="gitBranch:"
                 id="gitBranch"
                 name="gitBranch"
                 v-input-sync:gitBranch="form">
      </vuex-text>

      <vuex-text label="iterationDuration [ms]:"
                 id="iterationDuration"
                 name="iterationDuration"
                 v-input-sync:iterationDuration="form">
      </vuex-text>

      <div>
          <button type="submit"
                  v-on:click="submitConfig">
            Submit
          </button>
      </div>
    </form>
  `,
  methods: {
    submitConfig: function () {
      this.$store.commit('updateConfig', {
        repoUrl: this.form.repoUrl,
        gitBranch: this.form.gitBranch,
        iterationDuration: this.form.iterationDuration
      })
      this.$store.commit('finishSetup')

      createVisualization(this.$store)
    }
  }
}

let formatCommit = commit => {
  let date = new Date(commit.committer.timestamp * 1000)

  var year = date.getFullYear()
  var month = (date.getMonth() + 1).toString().padStart(2, '0') // lol@+1
  var day = date.getDate().toString().padStart(2, '0')
  var hours = date.getHours().toString().padStart(2, '0')
  var minutes = date.getMinutes().toString().padStart(2, '0')
  var seconds = date.getSeconds().toString().padStart(2, '0')

  let dateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  return `${dateStr} -- ${commit.message}`
}

const CommitView = {
  template: `
    <div id="commitView">
      <span
        v-for="(commit, index) in commitList"
        :class="['commit', index === 0 ? 'active' : 'inactive']">
        {{ commit }}
      </span>
    </div>
  `,
  computed: {
    commitList: {
      get () {
        return this.$store.state.commitList.map(formatCommit).reverse()
      }
    }
  }
}

const NetworkView = {
  components: { CommitView },
  template: `
    <div>
      <div id="header">loading (<span id="progress">undef</span>)</div>
      <div id="container"></div>
      <CommitView></CommitView>
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
      }
    }
  }
})
