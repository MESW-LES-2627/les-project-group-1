import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Gives Bun a fake browser (window, document, localStorage...) for React tests.
GlobalRegistrator.register();
