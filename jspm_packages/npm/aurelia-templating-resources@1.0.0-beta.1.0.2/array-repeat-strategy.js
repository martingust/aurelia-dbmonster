define(['exports', './repeat-utilities'], function (exports, _repeatUtilities) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var ArrayRepeatStrategy = (function () {
    function ArrayRepeatStrategy() {
      _classCallCheck(this, ArrayRepeatStrategy);
    }

    ArrayRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver(observerLocator, items) {
      return observerLocator.getArrayObserver(items);
    };

    ArrayRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
      var _this = this;

      if (repeat.viewsRequireLifecycle) {
        var removePromise = repeat.viewSlot.removeAll(true);
        if (removePromise instanceof Promise) {
          removePromise.then(function () {
            return _this._standardProcessInstanceChanged(repeat, items);
          });
          return;
        }
        this._standardProcessInstanceChanged(repeat, items);
        return;
      }
      this._inPlaceProcessItems(repeat, items);
    };

    ArrayRepeatStrategy.prototype._standardProcessInstanceChanged = function _standardProcessInstanceChanged(repeat, items) {
      for (var i = 0, ii = items.length; i < ii; i++) {
        var overrideContext = _repeatUtilities.createFullOverrideContext(repeat, items[i], i, ii);
        var view = repeat.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);
        repeat.viewSlot.add(view);
      }
    };

    ArrayRepeatStrategy.prototype._inPlaceProcessItems = function _inPlaceProcessItems(repeat, items) {
      var itemsLength = items.length;
      var viewsLength = repeat.viewSlot.children.length;

      while (viewsLength > itemsLength) {
        viewsLength--;
        repeat.viewSlot.removeAt(viewsLength, true);
      }

      var local = repeat.local;

      for (var i = 0; i < viewsLength; i++) {
        var view = repeat.viewSlot.children[i];
        var last = i === itemsLength - 1;
        var middle = i !== 0 && !last;

        if (view.bindingContext[local] === items[i] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
          continue;
        }

        view.bindingContext[local] = items[i];
        view.overrideContext.$middle = middle;
        view.overrideContext.$last = last;
        var j = view.bindings.length;
        while (j--) {
          _repeatUtilities.refreshBinding(view.bindings[j]);
        }
        j = view.controllers.length;
        while (j--) {
          var k = view.controllers[j].boundProperties.length;
          while (k--) {
            var binding = view.controllers[j].boundProperties[k].binding;
            _repeatUtilities.refreshBinding(binding);
          }
        }
      }

      for (var i = viewsLength; i < itemsLength; i++) {
        var overrideContext = _repeatUtilities.createFullOverrideContext(repeat, items[i], i, itemsLength);
        var view = repeat.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);
        repeat.viewSlot.add(view);
      }
    };

    ArrayRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, array, splices) {
      if (repeat.viewsRequireLifecycle) {
        this._standardProcessInstanceMutated(repeat, array, splices);
        return;
      }
      this._inPlaceProcessItems(repeat, array);
    };

    ArrayRepeatStrategy.prototype._standardProcessInstanceMutated = function _standardProcessInstanceMutated(repeat, array, splices) {
      var _this2 = this;

      var removeDelta = 0;
      var viewSlot = repeat.viewSlot;
      var rmPromises = [];

      for (var i = 0, ii = splices.length; i < ii; ++i) {
        var splice = splices[i];
        var removed = splice.removed;

        for (var j = 0, jj = removed.length; j < jj; ++j) {
          var removeIndex = splice.index + removeDelta + rmPromises.length;
          if (removeIndex < viewSlot.children.length) {
            var viewOrPromise = viewSlot.removeAt(removeIndex, true);
            if (viewOrPromise instanceof Promise) {
              rmPromises.push(viewOrPromise);
            }
          }
        }
        removeDelta -= splice.addedCount;
      }

      if (rmPromises.length > 0) {
        Promise.all(rmPromises).then(function () {
          var spliceIndexLow = _this2._handleAddedSplices(repeat, array, splices);
          _repeatUtilities.updateOverrideContexts(repeat.viewSlot.children, spliceIndexLow);
        });
      } else {
        var spliceIndexLow = this._handleAddedSplices(repeat, array, splices);
        _repeatUtilities.updateOverrideContexts(repeat.viewSlot.children, spliceIndexLow);
      }
    };

    ArrayRepeatStrategy.prototype._handleAddedSplices = function _handleAddedSplices(repeat, array, splices) {
      var spliceIndex = undefined;
      var spliceIndexLow = undefined;
      var arrayLength = array.length;
      for (var i = 0, ii = splices.length; i < ii; ++i) {
        var splice = splices[i];
        var addIndex = spliceIndex = splice.index;
        var end = splice.index + splice.addedCount;

        if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
          spliceIndexLow = spliceIndex;
        }

        console.log(array[addIndex], addIndex);

        for (; addIndex < end; ++addIndex) {
          var overrideContext = _repeatUtilities.createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
          var view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          repeat.viewSlot.insert(addIndex, view);
        }
      }

      return spliceIndexLow;
    };

    return ArrayRepeatStrategy;
  })();

  exports.ArrayRepeatStrategy = ArrayRepeatStrategy;
});