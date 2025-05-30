import get from 'lodash/get';
import map from 'lodash/map';

import Container from '../container.class';

import {
  OBJECT_CONTAINER_NAME_PATTERN,
  OBJECT_CONTAINER_OFFER_STORAGE_STANDARD,
  OBJECT_CONTAINER_OFFERS,
  OBJECT_CONTAINER_OFFERS_LABELS,
  OBJECT_CONTAINER_TYPE_OFFERS,
  OBJECT_CONTAINER_TYPES,
  STORAGE_PRICES_LINK,
  STORAGE_ASYNC_REPLICATION_LINK,
  STORAGES_CONTAINER_NAME_PATTERN,
  OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS,
  OBJECT_CONTAINER_DEPLOYMENT_MODES,
  OBJECT_CONTAINER_OFFER_SWIFT,
  OBJECT_CONTAINER_MODE_MULTI_ZONES,
  OBJECT_CONTAINER_MODE_MONO_ZONE,
  STORAGE_STANDARD_REGION_PLANCODE,
  STORAGE_STANDARD_PLANCODE,
  SWIFT_PLANCODE,
  OBJECT_CONTAINER_MODE_LOCAL_ZONE,
  DEPLOYMENT_MODE_LINK,
  OFFSITE_REPLICATION_CODE,
} from '../containers.constants';

import { CONTAINER_USER_ASSOCIATION_MODES } from './components/associate-user-to-container/constant';

export default class PciStoragesContainersAddController {
  /* @ngInject */
  constructor(
    $translate,
    atInternet,
    CucCloudMessage,
    PciProjectStorageBlockService,
    PciProjectStorageContainersService,
    OvhApiCloudProjectRegion,
    coreConfig,
  ) {
    const { ovhSubsidiary } = coreConfig.getUser();

    this.$translate = $translate;
    this.atInternet = atInternet;
    this.CucCloudMessage = CucCloudMessage;
    this.PciProjectStorageBlockService = PciProjectStorageBlockService;
    this.PciProjectStorageContainersService = PciProjectStorageContainersService;
    this.OvhApiCloudProjectRegion = OvhApiCloudProjectRegion;
    this.storagePricesLink =
      STORAGE_PRICES_LINK[ovhSubsidiary] || STORAGE_PRICES_LINK.DEFAULT;

    this.deploymentModeLink =
      DEPLOYMENT_MODE_LINK[ovhSubsidiary] || DEPLOYMENT_MODE_LINK.DEFAULT;

    this.asyncReplicationLink =
      STORAGE_ASYNC_REPLICATION_LINK[ovhSubsidiary] ||
      STORAGE_ASYNC_REPLICATION_LINK.DEFAULT;

    this.STORAGES_CONTAINER_NAME_PATTERN = STORAGES_CONTAINER_NAME_PATTERN;
    this.OBJECT_CONTAINER_NAME_PATTERN = OBJECT_CONTAINER_NAME_PATTERN;
    this.OBJECT_CONTAINER_OFFERS = OBJECT_CONTAINER_OFFERS;
    this.OBJECT_CONTAINER_OFFERS_LABELS = OBJECT_CONTAINER_OFFERS_LABELS;
    this.OBJECT_CONTAINER_TYPE_OFFERS = OBJECT_CONTAINER_TYPE_OFFERS;
    this.OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS = OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS;
    this.OBJECT_CONTAINER_DEPLOYMENT_MODES = OBJECT_CONTAINER_DEPLOYMENT_MODES;
    this.OBJECT_CONTAINER_OFFER_SWIFT = OBJECT_CONTAINER_OFFER_SWIFT;
    this.OBJECT_CONTAINER_MODE_MULTI_ZONES = OBJECT_CONTAINER_MODE_MULTI_ZONES;
    this.OBJECT_CONTAINER_MODE_MONO_ZONE = OBJECT_CONTAINER_MODE_MONO_ZONE;
    this.coreConfig = coreConfig;
  }

  $onInit() {
    this.loadMessages();

    this.isLoading = false;
    this.loadingPrice = false;

    this.displaySelectedRegion = false;
    this.displaySelectedType = false;

    this.types = OBJECT_CONTAINER_TYPES;
    this.typesList = map(this.types, (type) => ({
      id: type,
      name: this.$translate.instant(
        `pci_projects_project_storages_containers_add_type_${type}_description`,
      ),
    }));

    this.container = new Container({
      archive: this.archive,
      deploymentMode: null,
    });
    this.container.region = null;
    this.container.offer = this.archive
      ? null
      : OBJECT_CONTAINER_OFFER_STORAGE_STANDARD;
    this.isOffsiteReplicationEnabled = false;
    this.forceEnableVersioning = false;
    this.isBucketVersioningEnabled = false;

    this.userModel = {
      linkedMode: {
        selected: null,
        credential: null,
        isInProgress: false, // HTTP request
      },
      createMode: {
        user: null, // once generate new user
        credential: null, // new s3 user credential
        description: null, // new s3 user description
        isInProgress: false,
      },
      createOrLinkedMode: null,
    };
    if (!this.archive) this.setUsersForContainerCreation();
    this.preselectStepItem();
    this.PriceFormatter = new Intl.NumberFormat(
      this.coreConfig.getUserLocale().replace('_', '-'),
      {
        style: 'currency',
        currency: this.coreConfig.getUser().currency.code,
        maximumFractionDigits: 2,
      },
    );
    this.OffsiteReplicationPriceFormatter = new Intl.NumberFormat(
      this.coreConfig.getUserLocale().replace('_', '-'),
      {
        style: 'currency',
        currency: this.coreConfig.getUser().currency.code,
        maximumFractionDigits: 0,
      },
    );

    this.featureFlipLocalzoneContainer();
    this.setOffersPrices();
    this.setDeploymentModePrices();
    this.featureFlip3azContainer();
  }

  /**
   * Use this to preselect an item regarding current step
   */
  preselectStepItem() {
    const { steps } = this.redirectTarget;
    const currentStep = (this.currrentStep || 0) + 1; // to have human start count

    if (steps && currentStep === 1) {
      this.container.offer = steps[`STEP_${currentStep}`];
    }
  }

  loadMessages() {
    this.messageHandler = this.CucCloudMessage.subscribe(
      'pci.projects.project.storages.containers.add',
      {
        onMessage: () => this.refreshMessages(),
      },
    );
  }

  refreshMessages() {
    this.messages = this.messageHandler.getMessages();
  }

  shouldDisplayContainerName() {
    if (this.isRightOffer() && !this.isLocalZone()) {
      return !this.archive && this.currentStep > 4;
    }
    return !this.archive && !this.isAddingRegion && !this.isAddingRegionError;
  }

  featureFlip3azContainer() {
    if (!this.is3azAvailable) {
      const index = OBJECT_CONTAINER_DEPLOYMENT_MODES.indexOf(
        OBJECT_CONTAINER_MODE_MULTI_ZONES,
      );

      if (index > -1) {
        OBJECT_CONTAINER_DEPLOYMENT_MODES.splice(index, 1);
      }
    }
  }

  setUsersForContainerCreation() {
    this.users = this.allUserList.filter((user) => user.status === 'ok');
  }

  calculatePrice(planCode) {
    const hourlyPrice = this.catalog.addons
      .filter((addon) => addon.planCode === planCode)
      .map((addon) => addon.pricings[0].price)[0];

    if (!hourlyPrice) return null;

    return hourlyPrice * 730 * 1024 * 0.00000001;
  }

  featureFlipLocalzoneContainer() {
    if (!this.isLocalzoneAvailable) {
      const index = OBJECT_CONTAINER_DEPLOYMENT_MODES.indexOf(
        OBJECT_CONTAINER_MODE_LOCAL_ZONE,
      );

      if (index > -1) {
        OBJECT_CONTAINER_DEPLOYMENT_MODES.splice(index, 1);
      }
    }
  }

  setOffersPrices() {
    this.OBJECT_CONTAINER_OFFERS_LABELS[
      OBJECT_CONTAINER_OFFER_STORAGE_STANDARD
    ].price = this.PriceFormatter.format(
      this.calculatePrice(STORAGE_STANDARD_PLANCODE),
    );

    this.OBJECT_CONTAINER_OFFERS_LABELS[
      OBJECT_CONTAINER_OFFER_SWIFT
    ].price = this.PriceFormatter.format(this.calculatePrice(SWIFT_PLANCODE));

    this.OFFSITE_REPLICATION_PRICE = this.calculatePrice(
      OFFSITE_REPLICATION_CODE,
    );
  }

  getLowestPriceAddon(productCapability, regionType) {
    const codesList = productCapability
      .filter((item) =>
        item.regions.some((region) => region.type === regionType),
      )
      .map((item) => item.code);

    let lowestPrice = null;

    codesList.forEach((code) => {
      const catalogElement = this.catalog.addons.find(
        (addon) => addon.planCode === code,
      );

      if (catalogElement) {
        const [{ price }] = catalogElement.pricings;

        if (price > 0) {
          if (!lowestPrice || price < lowestPrice) {
            lowestPrice = price * 730 * 1024 * 0.00000001;
          }
        }
      }
    });

    return lowestPrice;
  }

  async setDeploymentModePrices() {
    await this.PciProjectStorageContainersService.getProductAvailability(
      this.projectId,
      this.coreConfig.getUser().ovhSubsidiary,
    ).then((productCapabilities) => {
      this.productCapabilities = productCapabilities;
      const productCapability = productCapabilities.plans?.filter((plan) =>
        plan.code?.startsWith(STORAGE_STANDARD_REGION_PLANCODE),
      );

      this.OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS[
        OBJECT_CONTAINER_MODE_MULTI_ZONES
      ].price =
        this.getLowestPriceAddon(
          productCapability,
          OBJECT_CONTAINER_MODE_MULTI_ZONES,
        ) &&
        this.PriceFormatter.format(
          this.getLowestPriceAddon(
            productCapability,
            OBJECT_CONTAINER_MODE_MULTI_ZONES,
          ),
        );

      this.OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS[
        OBJECT_CONTAINER_MODE_MONO_ZONE
      ].price =
        this.getLowestPriceAddon(
          productCapability,
          OBJECT_CONTAINER_MODE_MONO_ZONE,
        ) &&
        this.PriceFormatter.format(
          this.getLowestPriceAddon(
            productCapability,
            OBJECT_CONTAINER_MODE_MONO_ZONE,
          ),
        );

      this.OBJECT_CONTAINER_DEPLOYMENT_MODES_LABELS[
        OBJECT_CONTAINER_MODE_LOCAL_ZONE
      ].price =
        this.getLowestPriceAddon(
          productCapability,
          OBJECT_CONTAINER_MODE_LOCAL_ZONE,
        ) &&
        this.PriceFormatter.format(
          this.getLowestPriceAddon(
            productCapability,
            OBJECT_CONTAINER_MODE_LOCAL_ZONE,
          ),
        );
    });
  }

  isLocalZone() {
    return this.container.deploymentMode === OBJECT_CONTAINER_MODE_LOCAL_ZONE;
  }

  isRightOffer() {
    return OBJECT_CONTAINER_OFFER_STORAGE_STANDARD === this.container.offer;
  }

  isReadyForValidation() {
    const { createOrLinkedMode } = this.userModel;
    const { createMode, linkedMode } = this.userModel;

    return (
      createOrLinkedMode &&
      ((createMode.user && createMode.description) || linkedMode.selected)
    );
  }

  getUserOwnerId() {
    const { createMode, linkedMode } = this.userModel;

    return createMode?.user?.id || linkedMode?.selected?.id;
  }

  onOfferFocus() {
    this.displaySelectedOffer = false;
    this.container.deploymentMode = null;
  }

  onOfferSubmit() {
    this.displaySelectedOffer = true;
    if (!this.isRightOffer()) {
      this.resetOffsiteReplication();
    }
  }

  onContainerSolutionChange() {
    this.container.region = null;
    this.container.containerType = null;
  }

  onRegionsFocus() {
    this.displaySelectedRegion = false;
    this.container.region = null;

    this.reloadRegions = true;
  }

  reloadRegionsEnd() {
    this.reloadRegions = false;
  }

  onRegionChange() {
    this.displaySelectedRegion = true;

    if (this.container.region.enabled === false) {
      this.isAddingRegion = true;
      this.addRegion();
    }
  }

  addRegion() {
    return this.OvhApiCloudProjectRegion.v6()
      .addRegion(
        { serviceName: this.projectId },
        { region: this.container.region.name },
      )
      .$promise.then(() => {
        return this.OvhApiCloudProjectRegion.AvailableRegions()
          .v6()
          .resetQueryCache();
      })
      .then(() => {
        this.CucCloudMessage.success(
          this.$translate.instant(
            'pci_projects_project_storages_containers_add_add_region_success',
            {
              code: this.container.region.name,
            },
          ),
          'pci.projects.project.storages.containers.add',
        );
        this.isAddingRegion = false;
        this.isAddingRegionError = false;
      })
      .catch((error) => {
        this.CucCloudMessage.error(
          this.$translate.instant(
            'pci_projects_project_storages_containers_add_add_region_error',
            {
              message: get(error, 'data.message'),
            },
          ),
          'pci.projects.project.storages.containers.add',
        );
        this.isAddingRegion = false;
        this.isAddingRegionError = true;
      });
  }

  onTypesFocus() {
    this.displaySelectedType = false;
    this.loadingPrice = true;
    this.PciProjectStorageContainersService.getPriceEstimation(
      this.user.ovhSubsidiary,
    )
      .then((price) => {
        this.price = price;
        if (this.price !== null) {
          this.price.formatedPrice = this.getFormatedPrice(
            price.price / 100000000,
          );
        }
      })
      .finally(() => {
        this.loadingPrice = false;
      });
  }

  onTypeChange() {
    this.displaySelectedType = true;
    this.container.containerType = this.selectedType.id;
  }

  onDeploymentModeSubmit() {
    this.DEPLOYMENT_PRICE = this.getLowestPriceAddon(
      this.productCapabilities.plans?.filter((plan) =>
        plan.code?.startsWith(STORAGE_STANDARD_REGION_PLANCODE),
      ),
      OBJECT_CONTAINER_MODE_MULTI_ZONES,
    );
    if (
      this.container.deploymentMode !== this.OBJECT_CONTAINER_MODE_MULTI_ZONES
    ) {
      this.resetOffsiteReplication();
    }
  }

  handleOffsiteReplicationChange() {
    this.forceEnableVersioning = this.isOffsiteReplicationEnabled;
    if (this.forceEnableVersioning) {
      this.isBucketVersioningEnabled = true;
    }
  }

  add() {
    const containerOffer =
      this.container.offer === 'storage' ? 'standard' : this.container.offer;
    const containerTypeOffer = this.container.containerType
      ? `${this.container.containerType}::`
      : '';
    const dataCenterLocation = this.container.region.datacenterLocation;

    this.atInternet.trackClick({
      name: `storage_container_create_${containerOffer}_${dataCenterLocation}_${this
        .container.containerType || 'standard'}`,
      type: 'action',
    });
    this.isLoading = true;
    this.container.ownerId = this.getUserOwnerId();
    if (this.isOffsiteReplicationEnabled) {
      this.container.replication = {
        rules: [
          {
            id: '',
            status: 'enabled',
            priority: 1,
            deleteMarkerReplication: 'disabled',
          },
        ],
      };
    } else {
      this.container.replication = undefined;
    }
    if (this.isBucketVersioningEnabled) {
      this.container.versioning = { status: 'enabled' };
    } else {
      this.container.versioning = undefined;
    }
    return this.PciProjectStorageContainersService.addContainer(
      this.projectId,
      this.container,
    )
      .then(() => {
        const translationKey =
          this.userModel.createOrLinkedMode ===
          CONTAINER_USER_ASSOCIATION_MODES.CREATE
            ? 'pci_projects_project_storages_containers_add_success_message_with_user_creation'
            : 'pci_projects_project_storages_containers_add_success_message';
        const message = this.$translate.instant(translationKey, {
          container: this.container.name,
          userName: this.userModel.createMode?.user?.username,
        });
        const trackingTag = `_add::${containerOffer}_${dataCenterLocation}::${containerTypeOffer}creation_confirmation`;

        return this.goBackWithTrackingPage({
          message,
          type: 'success',
          reload: true,
          trackingTag,
        });
      })
      .catch((err) => {
        this.trackPage(
          `_add::${containerOffer}_${dataCenterLocation}::${containerTypeOffer}creation_error`,
        );
        return this.CucCloudMessage.error(
          this.$translate.instant(
            'pci_projects_project_storages_containers_add_error_post',
            { message: get(err, 'data.message', '') },
          ),
          'pci.projects.project.storages.containers.add',
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  cancel() {
    this.atInternet.trackClick({
      name: 'storage_container_cancel_creation',
      type: 'action',
    });
    return this.cancelCreate();
  }

  getFormatedPrice(price) {
    const languageLocale = this.user.language.replace('_', '-');
    return Intl.NumberFormat(languageLocale, {
      style: 'currency',
      currency: this.user.currency.code,
      maximumSignificantDigits: 1,
    }).format(price);
  }

  resetOffsiteReplication() {
    this.isOffsiteReplicationEnabled = false;
    this.forceEnableVersioning = false;
    this.isBucketVersioningEnabled = false;
  }
}
