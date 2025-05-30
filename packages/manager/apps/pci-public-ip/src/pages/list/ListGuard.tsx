import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OsdsSpinner } from '@ovhcloud/ods-components/react';
import { ODS_SPINNER_SIZE } from '@ovhcloud/ods-components';
import { useAllFailoverIPs } from '@/api/hooks/useFailoverIP';
import { useAllFloatingIP } from '@/api/hooks/useFloatingIP';
import { useOrderStore } from '@/hooks/order/useStore';

export default function ListGuard({
  projectId,
  children,
}: {
  projectId: string;
  children: JSX.Element;
}): JSX.Element {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);
  const { floatingIpCreation } = useOrderStore();

  const {
    data: failoverIPs,
    isLoading: isFailoverIPsLoading,
  } = useAllFailoverIPs(projectId);

  const {
    data: floatingIPs,
    isLoading: isFloatingIPsLoading,
  } = useAllFloatingIP(projectId);

  useEffect(() => {
    if (!isFailoverIPsLoading && !isFloatingIPsLoading) {
      if (
        floatingIpCreation ||
        failoverIPs?.length > 0 ||
        floatingIPs?.length > 0
      ) {
        setIsValid(true);
      } else {
        navigate(`/pci/projects/${projectId}/public-ips/onboarding`);
      }
    }
  }, [
    navigate,
    failoverIPs,
    floatingIPs,
    isFailoverIPsLoading,
    isFloatingIPsLoading,
  ]);

  return isValid ? (
    children
  ) : (
    <OsdsSpinner inline={true} size={ODS_SPINNER_SIZE.md} />
  );
}
