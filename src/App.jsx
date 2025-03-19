import { BrowserRouter } from 'react-router-dom';
import Routes from './Routes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
