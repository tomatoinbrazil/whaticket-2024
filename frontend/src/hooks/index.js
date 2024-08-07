import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';

import { LanguageProvider } from './useTranslations/useTranslation';


const AppProvider = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);
AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
