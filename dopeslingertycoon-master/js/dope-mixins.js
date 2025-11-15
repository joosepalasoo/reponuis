(function (window) {
  'use strict';

  var mixins = window.DopeMixins = window.DopeMixins || {};

  function defaultCalculateAvailableUpgrades(scope) {
    if (scope && typeof scope.calculateAvailableUpgrades === 'function') {
      scope.calculateAvailableUpgrades();
    }
  }

  mixins.attachModMenu = function ($scope, deps) {
    deps = deps || {};
    var focusDelay = typeof deps.focusDelay === 'number' ? deps.focusDelay : 200;
    var $timeout = deps.$timeout;
    var writeToCookie = typeof deps.writeToCookie === 'function' ? deps.writeToCookie : function () {};
    var requestUpgradeRecalc = typeof deps.calculateAvailableUpgrades === 'function'
      ? deps.calculateAvailableUpgrades
      : function () { defaultCalculateAvailableUpgrades($scope); };

    var defaults = {
      cashAmount: 1000000,
      respectAmount: 10000,
      territoryAmount: 1,
      discountAmount: 1
    };

    function ensureState() {
      if (!$scope.modMenu) {
        $scope.modMenu = angular.copy(defaults);
      } else {
        if (typeof $scope.modMenu.cashAmount !== 'number') {
          $scope.modMenu.cashAmount = defaults.cashAmount;
        }
        if (typeof $scope.modMenu.respectAmount !== 'number') {
          $scope.modMenu.respectAmount = defaults.respectAmount;
        }
        if (typeof $scope.modMenu.territoryAmount !== 'number') {
          $scope.modMenu.territoryAmount = defaults.territoryAmount;
        }
        if (typeof $scope.modMenu.discountAmount !== 'number') {
          $scope.modMenu.discountAmount = defaults.discountAmount;
        }
      }
      if (typeof $scope.modMenuMessage !== 'string') {
        $scope.modMenuMessage = '';
      }
    }

    ensureState();

    function applyCash(amount) {
      $scope.gameModel.cash += amount;
      $scope.gameModel.totalCashEarned += amount;
      writeToCookie();
    }

    function applyRespect(amount) {
      $scope.gameModel.respect += amount;
      writeToCookie();
    }

    function applyTerritory(amount) {
      $scope.gameModel.territoryUpgrades += amount;
      requestUpgradeRecalc();
      writeToCookie();
    }

    function applyDiscount(amount) {
      $scope.gameModel.discountUpgrades += amount;
      requestUpgradeRecalc();
      writeToCookie();
    }

    function unlockAllDrugs() {
      var unlocked = 0;
      for (var i = 0; i < drugsMaster.length; i++) {
        var drug = drugsMaster[i];
        var owned = false;
        for (var d = 0; d < $scope.gameModel.drugs.length; d++) {
          if ($scope.gameModel.drugs[d].name === drug.name) {
            owned = true;
            break;
          }
        }
        if (!owned) {
          $scope.gameModel.drugs.push(drug);
          unlocked++;
        }
      }

      for (var j = 0; j < productionMaster.length; j++) {
        var producer = productionMaster[j];
        var hasProducer = false;
        for (var p = 0; p < $scope.gameModel.production.length; p++) {
          if ($scope.gameModel.production[p].name === producer.name) {
            hasProducer = true;
            break;
          }
        }
        if (!hasProducer) {
          $scope.gameModel.production.push(producer);
        }
      }

      if (unlocked > 0) {
        requestUpgradeRecalc();
      }

      writeToCookie();
      return unlocked;
    }

    function releaseDealers() {
      var released = 0;
      for (var i = 0; i < $scope.gameModel.dealers.length; i++) {
        var dealer = $scope.gameModel.dealers[i];
        if (dealer.arrested) {
          dealer.arrested = false;
          dealer.bail = 0;
          dealer.arrestMessage = false;
          released++;
        }
      }
      if (released > 0) {
        writeToCookie();
      }
      return released;
    }

    $scope.openModMenu = function () {
      ensureState();
      $scope.modMenuMessage = '';
      if (typeof window.$ !== 'undefined') {
        $('#modMenuModal').modal('show');
      }
      if ($timeout) {
        $timeout(function () {
          var cashInput = document.getElementById('modCashInput');
          if (cashInput) {
            cashInput.focus();
            cashInput.select();
          }
        }, focusDelay);
      }
    };

    $scope.modAddCash = function () {
      var amount = parseFloat($scope.modMenu.cashAmount);
      if (isNaN(amount) || amount <= 0) {
        $scope.modMenuMessage = 'Enter a cash amount greater than 0.';
        return;
      }
      applyCash(amount);
      $scope.modMenuMessage = 'Added $' + formatNumber(amount) + ' cash.';
    };

    $scope.modAddRespect = function () {
      var amount = parseFloat($scope.modMenu.respectAmount);
      if (isNaN(amount) || amount <= 0) {
        $scope.modMenuMessage = 'Enter a respect amount greater than 0.';
        return;
      }
      applyRespect(amount);
      $scope.modMenuMessage = 'Added ' + formatNumber(amount) + ' respect.';
    };

    $scope.modAddTerritory = function () {
      var amount = parseInt($scope.modMenu.territoryAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        $scope.modMenuMessage = 'Enter the number of territory upgrades to grant.';
        return;
      }
      applyTerritory(amount);
      $scope.modMenuMessage = 'Granted ' + amount + ' territory upgrade' + (amount === 1 ? '' : 's') + '.';
    };

    $scope.modAddDiscount = function () {
      var amount = parseInt($scope.modMenu.discountAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        $scope.modMenuMessage = 'Enter the number of discount upgrades to grant.';
        return;
      }
      applyDiscount(amount);
      $scope.modMenuMessage = 'Granted ' + amount + ' price discount upgrade' + (amount === 1 ? '' : 's') + '.';
    };

    $scope.modQuickAddCash = function (amount) {
      $scope.modMenu.cashAmount = amount;
      $scope.modAddCash();
    };

    $scope.modQuickAddRespect = function (amount) {
      $scope.modMenu.respectAmount = amount;
      $scope.modAddRespect();
    };

    $scope.modQuickAddTerritory = function (amount) {
      $scope.modMenu.territoryAmount = amount;
      $scope.modAddTerritory();
    };

    $scope.modQuickAddDiscount = function (amount) {
      $scope.modMenu.discountAmount = amount;
      $scope.modAddDiscount();
    };

    $scope.modUnlockAllDrugs = function () {
      var unlocked = unlockAllDrugs();
      $scope.modMenuMessage = unlocked > 0 ? ('Unlocked ' + unlocked + ' drug' + (unlocked === 1 ? '' : 's') + '.') : 'All drugs are already unlocked.';
    };

    $scope.modReleaseDealers = function () {
      var released = releaseDealers();
      $scope.modMenuMessage = released > 0 ? ('Released ' + released + ' arrested dealer' + (released === 1 ? '' : 's') + '.') : 'No dealers are currently arrested.';
    };

    return {
      ensureState: ensureState
    };
  };

  mixins.attachSpecialOps = function ($scope, deps) {
    deps = deps || {};
    var writeToCookie = typeof deps.writeToCookie === 'function' ? deps.writeToCookie : function () {};

    var heistRespectCost = deps.heistRespectCost || 750;
    var heistDurationSeconds = deps.heistDurationSeconds || 30;
    var heistCooldownSeconds = deps.heistCooldownSeconds || 300;
    var informantCashCost = deps.informantCashCost || 50000;
    var informantRespectCost = deps.informantRespectCost || 250;
    var informantDurationSeconds = deps.informantDurationSeconds || 180;

    var HEIST_DURATION_MS = heistDurationSeconds * 1000;
    var HEIST_COOLDOWN_MS = heistCooldownSeconds * 1000;
    var INFORMANT_DURATION_MS = informantDurationSeconds * 1000;

    var defaultHeistStatus = 'Crew is idle and ready for orders.';
    var defaultInformantStatus = 'No informants currently on the payroll.';

    $scope.heistRespectCost = heistRespectCost;
    $scope.heistDurationSeconds = heistDurationSeconds;
    $scope.heistCooldownSeconds = heistCooldownSeconds;
    $scope.informantCashCost = informantCashCost;
    $scope.informantRespectCost = informantRespectCost;
    $scope.informantDurationSeconds = informantDurationSeconds;
    $scope.heistProgress = $scope.heistProgress || 0;
    $scope.heistStatusMessage = $scope.heistStatusMessage || '';
    $scope.informantStatusMessage = $scope.informantStatusMessage || '';

    function ensureDefaults() {
      if (!$scope.gameModel) {
        return;
      }
      if (typeof $scope.gameModel.heistInProgress === 'undefined') {
        $scope.gameModel.heistInProgress = false;
      }
      if (typeof $scope.gameModel.heistStartTime === 'undefined') {
        $scope.gameModel.heistStartTime = 0;
      }
      if (typeof $scope.gameModel.heistCompleteTime === 'undefined') {
        $scope.gameModel.heistCompleteTime = 0;
      }
      if (typeof $scope.gameModel.lastHeistTime === 'undefined') {
        $scope.gameModel.lastHeistTime = 0;
      }
      if (typeof $scope.gameModel.heistStatus !== 'string') {
        $scope.gameModel.heistStatus = defaultHeistStatus;
      }
      if (typeof $scope.gameModel.informantExpires === 'undefined') {
        $scope.gameModel.informantExpires = 0;
      }
      if (typeof $scope.gameModel.informantStatus !== 'string') {
        $scope.gameModel.informantStatus = defaultInformantStatus;
      }
    }

    function syncMessages() {
      if (!$scope.gameModel) {
        return;
      }
      $scope.heistStatusMessage = $scope.gameModel.heistStatus || '';
      $scope.informantStatusMessage = $scope.gameModel.informantStatus || '';
    }

    function syncProgress(referenceTime) {
      if (!$scope.gameModel) {
        $scope.heistProgress = 0;
        return;
      }
      if ($scope.gameModel.heistInProgress) {
        var elapsed = Math.max(0, (referenceTime || Date.now()) - $scope.gameModel.heistStartTime);
        $scope.heistProgress = Math.min(100, (elapsed / HEIST_DURATION_MS) * 100);
      } else {
        $scope.heistProgress = 0;
      }
    }

    ensureDefaults();
    syncMessages();
    syncProgress();

    function setHeistStatus(message) {
      if (!$scope.gameModel) {
        return;
      }
      $scope.heistStatusMessage = message;
      $scope.gameModel.heistStatus = message;
    }

    function setInformantStatus(message) {
      if (!$scope.gameModel) {
        return;
      }
      $scope.informantStatusMessage = message;
      $scope.gameModel.informantStatus = message;
    }

    function heistReady(now) {
      if (!$scope.gameModel) {
        return false;
      }
      if ($scope.gameModel.heistInProgress) {
        return false;
      }
      var readyTime = ($scope.gameModel.lastHeistTime || 0) + HEIST_COOLDOWN_MS;
      return (now || Date.now()) >= readyTime;
    }

    function heistTimeRemaining() {
      if (!$scope.gameModel || !$scope.gameModel.heistInProgress) {
        return 0;
      }
      return Math.max(0, Math.ceil(($scope.gameModel.heistCompleteTime - Date.now()) / 1000));
    }

    function heistCooldownRemaining() {
      if (!$scope.gameModel) {
        return 0;
      }
      if ($scope.gameModel.heistInProgress) {
        return heistTimeRemaining();
      }
      var remaining = Math.max(0, (($scope.gameModel.lastHeistTime + HEIST_COOLDOWN_MS) - Date.now()) / 1000);
      return Math.ceil(remaining);
    }

    function isInformantActive(referenceTime) {
      if (!$scope.gameModel || !$scope.gameModel.informantExpires) {
        return false;
      }
      return $scope.gameModel.informantExpires > (referenceTime || Date.now());
    }

    function informantTimeRemaining() {
      if (!isInformantActive()) {
        return 0;
      }
      return Math.max(0, Math.ceil(($scope.gameModel.informantExpires - Date.now()) / 1000));
    }

    function resolveHeist() {
      var completionTimestamp = $scope.gameModel.heistCompleteTime || Date.now();
      var baseCash = Math.max(25000, $scope.gameModel.totalCashEarned * 0.02);
      var baseRespect = Math.max(100, ($scope.gameModel.respectPerSecond || 1) * 120);
      var cashReward = Math.round(baseCash * (1.2 + Math.random()));
      var respectReward = Math.round(baseRespect * (0.6 + Math.random()));
      var summary = 'Heist complete! The crew delivered ' + formatMoney(cashReward) + ' and ' + formatNumber(respectReward) + ' respect.';
      var bonusRoll = Math.random();
      if (bonusRoll > 0.9) {
        cashReward = Math.round(cashReward * 2);
        respectReward = Math.round(respectReward * 1.5);
        if (Math.random() > 0.5) {
          $scope.gameModel.territoryUpgrades += 1;
          summary += ' They also claimed new territory for the empire!';
        } else {
          $scope.gameModel.discountUpgrades += 1;
          summary += ' They negotiated a permanent supplier discount!';
        }
      } else if (bonusRoll < 0.12) {
        var penalty = Math.round(cashReward * 0.25);
        cashReward = Math.max(0, cashReward - penalty);
        summary += ' Heat from the cops forced you to part with ' + formatMoney(penalty) + ' in hush money.';
      }
      $scope.gameModel.cash += cashReward;
      $scope.gameModel.totalCashEarned += cashReward;
      $scope.gameModel.respect += respectReward;
      $scope.gameModel.heistInProgress = false;
      $scope.gameModel.heistStartTime = 0;
      $scope.gameModel.heistCompleteTime = 0;
      $scope.gameModel.lastHeistTime = Math.max(completionTimestamp, Date.now());
      $scope.heistProgress = 100;
      setHeistStatus(summary);
      writeToCookie();
      return summary;
    }

    $scope.heistReady = function () {
      return heistReady();
    };

    $scope.heistTimeRemaining = heistTimeRemaining;

    $scope.heistCooldownRemaining = heistCooldownRemaining;

    $scope.startHeist = function () {
      if (!$scope.gameModel) {
        return;
      }
      if ($scope.gameModel.heistInProgress || !heistReady()) {
        return;
      }
      if ($scope.gameModel.respect < heistRespectCost) {
        setHeistStatus('You need more respect before the crew will risk another heist.');
        return;
      }
      $scope.gameModel.respect -= heistRespectCost;
      var now = Date.now();
      $scope.gameModel.heistInProgress = true;
      $scope.gameModel.heistStartTime = now;
      $scope.gameModel.heistCompleteTime = now + HEIST_DURATION_MS;
      $scope.gameModel.lastHeistTime = now;
      $scope.heistProgress = 0;
      setHeistStatus('Crew is executing the heist. Hold tight for ' + heistDurationSeconds + ' seconds.');
      writeToCookie();
    };

    $scope.informantActive = function () {
      return isInformantActive();
    };

    $scope.informantTimeRemaining = informantTimeRemaining;

    $scope.hireInformant = function () {
      if (!$scope.gameModel) {
        return;
      }
      if ($scope.gameModel.cash < informantCashCost || $scope.gameModel.respect < informantRespectCost) {
        setInformantStatus('You need more cash and respect before anyone will risk informing for you.');
        return;
      }
      var wasActive = isInformantActive();
      $scope.gameModel.cash -= informantCashCost;
      $scope.gameModel.respect -= informantRespectCost;
      var baseTime = wasActive ? $scope.gameModel.informantExpires : Date.now();
      $scope.gameModel.informantExpires = baseTime + INFORMANT_DURATION_MS;
      if (wasActive) {
        setInformantStatus('Your informant extended their cover for another ' + informantDurationSeconds + ' seconds.');
      } else {
        setInformantStatus('Your informant is feeding intel for the next ' + informantDurationSeconds + ' seconds.');
      }
      writeToCookie();
    };

    $scope.$watch(function () {
      return $scope.gameModel && $scope.gameModel.heistStatus;
    }, function (value) {
      if (typeof value === 'string' && value !== $scope.heistStatusMessage) {
        $scope.heistStatusMessage = value;
      }
    });

    $scope.$watch(function () {
      return $scope.gameModel && $scope.gameModel.informantStatus;
    }, function (value) {
      if (typeof value === 'string' && value !== $scope.informantStatusMessage) {
        $scope.informantStatusMessage = value;
      }
    });

    $scope.$watch(function () {
      return $scope.gameModel;
    }, function (model) {
      if (!model) {
        return;
      }
      ensureDefaults();
      syncMessages();
      syncProgress();
    });

    function onTick(updateTime) {
      ensureDefaults();
      var changed = false;
      if (!$scope.gameModel) {
        return changed;
      }
      if ($scope.gameModel.informantExpires && $scope.gameModel.informantExpires <= updateTime) {
        $scope.gameModel.informantExpires = 0;
        setInformantStatus('Your informant has gone dark. Arrest risk is back to normal.');
        writeToCookie();
        changed = true;
      }
      if ($scope.gameModel.heistInProgress) {
        var elapsed = Math.max(0, updateTime - $scope.gameModel.heistStartTime);
        $scope.heistProgress = Math.min(100, (elapsed / HEIST_DURATION_MS) * 100);
        if ($scope.gameModel.heistCompleteTime <= updateTime) {
          resolveHeist();
          changed = true;
        }
      } else if ($scope.heistProgress !== 0) {
        $scope.heistProgress = 0;
      }
      return changed;
    }

    return {
      ensureDefaults: ensureDefaults,
      onReady: function () {
        ensureDefaults();
        syncMessages();
        syncProgress();
      },
      onTick: onTick,
      isInformantActive: function (referenceTime) {
        return isInformantActive(referenceTime);
      }
    };
  };

})(window);
