import React from 'react'
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom'
import Demo from './app/demo'

export default class Bootstrap extends React.PureComponent {
  render () {
    return (
      <div>
        <HashRouter>
          <Switch>
            <Redirect exact from='/' to='/index' />
            <Route exact path='/index' component={Demo} />
          </Switch>
        </HashRouter>
      </div>
    )
  }
}
