import React, {
    createContext, useState, useContext,
  } from 'react';
  import PropTypes from 'prop-types';
 
  const LanguageContext = createContext;
  
  const LanguageProvider = ({ children }) => {
    const [defaultLg, setDefaultLg] = useState(() => {
      const language = localStorage.getItem('@logyca:language');
  
      if (language) {
        return language;
      }
      return 'pt';
    });
  
    const handleSetLanguage = (lg) => {
      localStorage.removeItem('@logyca:language');
      localStorage.setItem('@logyca:language', lg);
      setDefaultLg(lg)
    };
  
    return (
      <LanguageContext.Provider value={{ defaultLg, handleSetLanguage }}>
        {children}
      </LanguageContext.Provider>
    );
  };
  
  function useTranslation() {
    const context = useContext(LanguageContext);
  
    if (!context) {
      throw new Error('useTranslation must be used within an LanguageProvider');
    }
  
    return context;
  }
  LanguageProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  
  export { LanguageProvider, useTranslation };
  