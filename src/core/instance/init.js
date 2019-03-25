/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// console.log('进入了init.js')
export function initMixin (Vue: Class<Component>) {
  // console.log('开始了initMixin融合处理')
  Vue.prototype._init = function (options?: Object) {
    console.log('进入了_init方法')
    // console.log('options is ', options)
    const vm: Component = this
    // a uid
    vm._uid = uid++

    // 简单地说是用来测试vue性能的
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // 如果有options且有组件的情况下
    if (options && options._isComponent) {
      // console.log('有组件')
      // 如果是组件则进入组件方法，包括全局组件和局部组件
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // console.log('无组件')
      // console.log(vm.constructor) // 这里vm的constructor指的是上一层Vue这个function
      // console.log(options) // 在这个时候options还是最早期的{el: "#app", data: {…}, components: {…}}
      // console.log('此时调用了mergeOptions来合并构造函数的options和传入的options')
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    // console.log('vm.$options ', vm.$options)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // console.log('initLifecycle')
    initLifecycle(vm)
    // console.log('initEvents')
    initEvents(vm)
    // console.log('initRender')
    initRender(vm)
    // console.log('callHookbeforeCreate')
    callHook(vm, 'beforeCreate')
    // console.log('initInjections')
    initInjections(vm) // resolve injections before data/props
    // console.log('initState')
    initState(vm)
    // console.log('initProvide')
    initProvide(vm) // resolve provide after data/props
    // console.log('callHookcreated')
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // console.log('调用$mount')
      vm.$mount(vm.$options.el)
    }
  }
}

// 初始化内部组件
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // console.log('初始化内部组件')
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  // console.log('Ctor.prototype is ', Ctor.prototype) // Ctor是构造函数
  // console.log('CtorOptions is ', Ctor.options)
  // console.log('Ctor is ', Ctor)
  let options = Ctor.options
  // 有super属性，说明Ctor是Vue.extend构建的子类，也是说明这个Ctor是component进来的
  if (Ctor.super) {
    // console.log('Ctor存在super')
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    // console.log('superOptions is ', superOptions)
    // console.log('cachedSuperOptions is ', cachedSuperOptions)
    if (superOptions !== cachedSuperOptions) {
      // console.log('父级options和Ctor本来存的父级options不同了')
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
        // 这个extendOptions实际上是在Vue.extend的时候传入的对象
      }
      // console.log('resolveConstructorOptions 调用了 mergeOptions 方法')
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  // console.log('latestoptions is ', latest)
  const sealed = Ctor.sealedOptions
  // console.log('sealedoptions is ', sealed)
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
