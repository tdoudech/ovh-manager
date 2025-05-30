import filter from 'lodash/filter';
import map from 'lodash/map';

export default /* @ngInject */ ($stateProvider) => {
  $stateProvider.state('billing.autorenew.enableRedirection', {
    url: '/enable?services',
    redirectTo: 'billing.autorenew.services.enable',
  });

  $stateProvider.state('billing.autorenew.services.enable', {
    url: '/enable?services',
    component: 'billingAutorenewEnable',
    translations: { value: ['.'], format: 'json' },
    resolve: {
      goBack: /* @ngInject */ (goToAutorenew) => goToAutorenew,
      servicesId: /* @ngInject */ ($transition$) =>
        $transition$.params().services.split(','),
      servicesList: /* @ngInject */ (
        BillingAutorenewEnable,
        billingServices,
        currentUser,
        servicesId,
      ) =>
        BillingAutorenewEnable.constructor.groupByAutorenewCapabilities(
          filter(billingServices, (service) =>
            servicesId.includes(service.id.toString()),
          ),
          currentUser.auth.account,
        ),
      /* @ngInject */
      updateRenew: (BillingAutoRenew) => (services) =>
        BillingAutoRenew.updateServices(
          map(services, (service) => {
            service.setAutomaticRenew();
            return service;
          }),
        ),
      breadcrumb: /* @ngInject */ ($translate) =>
        $translate.instant('billing_autorenew_enable_breadcrumb'),
    },
  });
};
