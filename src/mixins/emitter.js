/**
 * 广播方法定义
 * @param {String} componentName 组件名称
 * @param {String} eventName 事件名称
 * @param {Object} params  参数
 */
function broadcast(componentName, eventName, params) {
  //遍历组件中的子组件
  this.$children.forEach(child => {
    //vm.$options 用于当前 Vue 实例的初始化选项。需要在选项中包含自定义 property 时会有用处：
    var name = child.$options.componentName;
    //递归确保每一个孙和子组件都能接收到
    if (name === componentName) {
      child.$emit.apply(child, [eventName].concat(params));
    } else {
      broadcast.apply(child, [componentName, eventName].concat([params]));
    }
  });
}
export default {
  methods: {
    /**
 * 向父爷传播方法定义
 * @param {String} componentName 组件名称
 * @param {String} eventName 事件名称
 * @param {Object} params  参数
 */
    dispatch(componentName, eventName, params) {
      var parent = this.$parent || this.$root;
      var name = parent.$options.componentName;

      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent;

        if (parent) {
          name = parent.$options.componentName;
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    },
    broadcast(componentName, eventName, params) {
      broadcast.call(this, componentName, eventName, params);
    }
  }
};
