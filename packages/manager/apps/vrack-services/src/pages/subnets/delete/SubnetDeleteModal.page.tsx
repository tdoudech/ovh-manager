import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useOvhTracking,
  ButtonType,
  PageLocation,
  PageType,
  TrackingClickParams,
} from '@ovh-ux/manager-react-shell-client';
import { DeleteModal } from '@ovh-ux/manager-react-components';
import {
  useVrackService,
  useUpdateVrackServices,
} from '@ovh-ux/manager-network-common';
import { PageName } from '@/utils/tracking';
import { MessagesContext } from '@/components/feedback-messages/Messages.context';
import { getDisplayName } from '@/utils/vrack-services';

const sharedTrackingParams: TrackingClickParams = {
  location: PageLocation.popup,
  buttonType: ButtonType.button,
};

export default function SubnetDeleteModal() {
  const { t } = useTranslation('vrack-services/subnets');
  const { id, cidr } = useParams();
  const cidrToDelete = cidr.replace('_', '/');
  const { addSuccessMessage } = React.useContext(MessagesContext);
  const { trackPage, trackClick } = useOvhTracking();
  const navigate = useNavigate();

  const onClose = () => {
    trackClick({
      ...sharedTrackingParams,
      actionType: 'exit',
      actions: ['delete_subnets', 'cancel'],
    });
    navigate('..');
  };

  const { data: vs } = useVrackService();
  const {
    deleteSubnet,
    isPending,
    updateError,
    isError,
  } = useUpdateVrackServices({
    id,
    onSuccess: () => {
      trackPage({
        pageType: PageType.bannerSuccess,
        pageName: PageName.successDeleteSubnet,
      });
      navigate('..');
      addSuccessMessage(
        t('subnetDeleteSuccess', {
          id: getDisplayName(vs),
          cidr: cidrToDelete,
        }),
        { vrackServicesId: id },
      );
    },
    onError: () => {
      trackPage({
        pageType: PageType.bannerError,
        pageName: PageName.errorDeleteSubnet,
      });
    },
  });

  return (
    <DeleteModal
      isOpen
      closeModal={onClose}
      onConfirmDelete={() => {
        trackClick({
          ...sharedTrackingParams,
          actionType: 'action',
          actions: ['delete_subnets', 'confirm'],
        });
        deleteSubnet({ vs, cidrToDelete });
      }}
      error={isError ? updateError?.response?.data?.message : null}
      isLoading={isPending}
    />
  );
}
