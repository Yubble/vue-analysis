/* @flow */

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    // 在mixin方法中，传入的options与Vue原本的options融合了
    // console.log('调用了全局的mixin')
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
