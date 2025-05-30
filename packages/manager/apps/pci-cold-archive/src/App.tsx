import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createHashRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';
import queryClient from './queryClient';

import Routes from '@/routes';
import '@ovhcloud/ods-themes/default';

const routes = createHashRouter(createRoutesFromElements(Routes));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={routes} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
