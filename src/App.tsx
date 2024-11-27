import React from 'react';
import { Button } from 'antd';

import logo from './logo.svg';
import './App.css';

const App: React.FC = () => (
  <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Edit <code>src/App.tsx</code> and save to reload.
      </p>

      <div className="App">
        <Button type="primary">Learn React</Button>
      </div>
    </header>
  </div>
);

export default App;