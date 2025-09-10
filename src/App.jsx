import { useState } from 'react'
import './App.css'
import Navbar from './Components/Navbar'
import Home from './Pages/Home';
import Footer from './Components/Footer';

function App() {
  console.log('🚀 App component rendering');

  try {
    return (
      <>
        <Navbar/>
        <Home/>
        <Footer/>
      </>
    )
  } catch (error) {
    console.error('❌ App rendering error:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-red-800 font-medium text-lg mb-2">App Error</h2>
          <p className="text-red-600 text-sm mb-4">Error: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

export default App
