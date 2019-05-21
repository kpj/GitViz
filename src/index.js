import Vue from 'vue'
import Vuex from 'vuex'
import VuexForms, { Form } from 'vuex-forms'

import { createVisualization } from './visualization'

Vue.use(Vuex)
Vue.use(VuexForms)

const store = new Vuex.Store({
  state: {
    inSetupState: true,
    config: {
      repoUrl: 'https://github.com/kpj/GitViz',
      iterationDuration: 2000,
      gitBranch: 'master'
    }
  },
  mutations: {
    updateConfig: (state, value) => {
      state.config = value
    },
    finishSetup: state => {
      state.inSetupState = false
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

      <div class="has-text-centered">
          <button type="submit"
                  class="button"
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

      createVisualization(store.state.config)
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
      }
    }
  }
})
