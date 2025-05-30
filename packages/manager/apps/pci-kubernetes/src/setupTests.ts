import '@testing-library/jest-dom';
import 'element-internals-polyfill';
import { vi } from 'vitest';

vi.mock('@/hooks/use3azPlanAvaible', () => ({
  default: vi.fn().mockReturnValue(true),
}));

vi.mock('@/hooks/useSavingPlanAvailable', () => ({
  default: vi.fn().mockReturnValue(true),
}));

vi.mock('react-router-dom', async () => {
  const mod = await vi.importActual('react-router-dom');
  return {
    ...mod,
    useSearchParams: () => [new URLSearchParams({})],
    useParams: vi
      .fn()
      .mockReturnValue({ projectId: 'project-id', kubeId: 'kube-id' }),
    useHref: vi.fn(),
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
    Navigate: () => null,
    Outlet: vi.fn(() => 'Outlet'),
  };
});

vi.mock('@ovh-ux/manager-pci-common', async () => {
  const mod = await vi.importActual('@ovh-ux/manager-pci-common');
  return {
    ...mod,
    useProject: vi.fn().mockResolvedValue({
      projectName: 'project-name',
      project_id: 'project-id',
    }),
  };
});

vi.mock('@ovh-ux/manager-react-components', async () => {
  const mod = await vi.importActual('@ovh-ux/manager-react-components');
  return {
    ...mod,
    useProjectUrl: vi.fn().mockReturnValue('mockProjectUrl'),
    Notifications: vi.fn(),
    useTracking: vi.fn(() => ({
      trackPage: vi.fn(),
      trackClick: vi.fn(),
    })),
    PciGuidesHeader: vi.fn().mockReturnValue(null),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (translationKey: string) => translationKey,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      exists: () => true,
    },
  }),
  Trans: ({ children }: { children: string }) => children,
}));

vi.mock('@ovh-ux/manager-react-shell-client', async () => {
  const mod = await vi.importActual('@ovh-ux/manager-react-shell-client');
  return {
    ...mod,
    useTracking: vi.fn(() => ({
      trackPage: vi.fn(),
      trackClick: vi.fn(),
    })),
  };
});

vi.mock('@ovh-ux/manager-core-api', async () => {
  const mod = await vi.importActual('@ovh-ux/manager-core-api');
  return {
    ...mod,
    fetchIcebergV6: vi.fn(),
    v6: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});
