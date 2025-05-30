import angular from 'angular';
import 'angular-translate';
import 'oclazyload';
import 'ovh-api-services';
import ngOvhUtils from '@ovh-ux/ng-ovh-utils';
import '@ovh-ux/ui-kit';
import '@uirouter/angularjs';

import { ApiV2ListHelper } from '@ovh-ux/manager-ng-apiv2-helper';

import advanced from './advanced/advanced.module';
import dashboard from './dashboard/user-dashboard.module';
import emails from './emails/user-emails.module';
import gdpr from './gdpr/gdpr.module';
import infos from './infos/user-infos.module';
import ipRestriction from './ip/restriction/user-ip-restriction.module';
import newAccountForm from './components/newAccountForm/new-account-form-component.module';
import security from './security/user-security.module';
import supportLevel from './support-level/support-level.module';

import routing from './user.routes';

import userPasswordController from './password/user-password.controller';
import userPasswordTemplate from './password/user-password.html';

const moduleName = 'UserAccount';

angular
  .module(moduleName, [
    ngOvhUtils,
    'oc.lazyLoad',
    'oui',
    'ovh-api-services',
    'pascalprecht.translate',
    'ui.router',
    advanced,
    dashboard,
    emails,
    gdpr,
    infos,
    ipRestriction,
    newAccountForm,
    security,
    supportLevel,
    ApiV2ListHelper.moduleName,
  ])
  .config(routing)
  .controller(
    'UserAccount.controllers.doubleAuth.password',
    userPasswordController,
  )
  .run(
    /* @ngInject */ ($templateCache) => {
      $templateCache.put(
        'account/user/password/user-password.html',
        userPasswordTemplate,
      );
    },
  )
  .run(/* @ngTranslationsInject:json ./translations */);

export default moduleName;
