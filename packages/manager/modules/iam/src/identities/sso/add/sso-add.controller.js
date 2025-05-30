import { SSO_TRACKING_HITS } from '../sso.constants';

export default class IamUsersSsoAddCtrl {
  /* @ngInject */
  constructor($scope, $translate, Alerter, IamSsoService) {
    this.$scope = $scope;
    this.ssoService = IamSsoService;
    this.alerter = Alerter;
    this.$translate = $translate;
    this.user = {
      group: 'DEFAULT',
    };
    this.loader = false;
    this.identityProvider = {
      metadata: null,
      userAttributeName: null,
      groupAttributeName: null,
      disableUsers: false,
    };
  }

  $onInit() {
    this.$scope.addSso = this.addSso.bind(this);
    this.enableLocalUsers = true;
    this.$scope.trackPage(SSO_TRACKING_HITS.CREATE_SSO_MODAL);
  }

  addSso() {
    this.$scope.trackClick(SSO_TRACKING_HITS.CREATE_SSO_CONFIRM);
    this.loader = true;
    this.identityProvider.disableUsers = !this.enableLocalUsers;

    this.ssoService
      .addIdentityProvider(this.identityProvider)
      .then(() => {
        this.$scope.trackPage(SSO_TRACKING_HITS.CREATE_SSO_SUCCESS);
        return this.alerter.success(
          this.$translate.instant('sso_add_success_message'),
          'iam-sso-alert',
        );
      })
      .catch((err) => {
        this.$scope.trackPage(SSO_TRACKING_HITS.CREATE_SSO_ERROR);
        if (err.status === 403) {
          return this.alerter.warning(
            `${this.$translate.instant(
              'sso_add_error_message',
            )} ${this.$translate.instant('user_need_rights_message')} ${
              err.data.details.unauthorizedActionsByIAM
            }`,
            'iam-sso-alert',
          );
        }
        return this.alerter.error(
          `${this.$translate.instant('sso_add_error_message')} ${
            err.data.message
          }`,
          'iam-sso-alert',
        );
      })
      .finally(() => {
        this.loader = false;
        this.$scope.resetAction();
      });
  }

  close() {
    this.$scope.trackClick(SSO_TRACKING_HITS.CREATE_SSO_CANCEL);
    this.$scope.resetAction();
  }
}
