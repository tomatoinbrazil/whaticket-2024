import React from "react";

const TranslationContextContext = React.createContext({ handleSetLanguage: () => {}, defaultLg: 'pt' });

export default TranslationContextContext;