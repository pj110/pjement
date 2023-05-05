<template>
  <form class="el-form" :class="[
    labelPosition ? 'el-form--label-' + labelPosition : '',
    { 'el-form--inline': inline }
  ]">
    <slot></slot>
  </form>
</template>
<script>
import objectAssign from 'element-ui/src/utils/merge';

export default {
  name: 'ElForm',

  componentName: 'ElForm',
  //将elForm下传子孙组件
  provide() {
    return {
      elForm: this
    };
  },

  props: {
    model: Object,//表单数据对象
    rules: Object,//表单验证规则
    labelPosition: String,//表单域标签的位置，如果值为 left 或者 right 时，则需要设置 label-width
    labelWidth: String,//表单域标签的宽度
    labelSuffix: {//表单域标签的后缀
      type: String,
      default: ''
    },
    inline: Boolean,//行内表单模式
    inlineMessage: Boolean,//是否以行内形式展示校验信息
    statusIcon: Boolean,//是否在输入框中显示校验结果反馈图标
    showMessage: {//是否显示校验错误信息
      type: Boolean,
      default: true
    },
    size: String,//用于控制该表单内组件的尺寸
    disabled: Boolean,//是否禁用该表单内的所有组件
    validateOnRuleChange: {//是否在 rules 属性改变后立即触发一次验证
      type: Boolean,
      default: true
    },
    hideRequiredAsterisk: {//是否隐藏必填字段的标签旁边的红色星号
      type: Boolean,
      default: false
    }
  },
  watch: {
    //监听表单验证规则
    rules() {
      // remove then add event listeners on form-item after form rules change
      // 表单规则更改后，删除并添加表单项上的事件侦听器
      this.fields.forEach(field => {
        field.removeValidateEvents();
        field.addValidateEvents();
      });
      // 改变之后是否立即触发一次验证
      if (this.validateOnRuleChange) {
        this.validate(() => { });
      }
    }
  },
  //计算属性
  computed: {
    //暂时不知？？？？
    autoLabelWidth() {
      if (!this.potentialLabelWidthArr.length) return 0;
      const max = Math.max(...this.potentialLabelWidthArr);
      return max ? `${max}px` : '';
    }
  },
  data() {
    return {
      fields: [],
      potentialLabelWidthArr: [] // use this array to calculate auto width
    };
  },
  created() {
    //监听当前实例上的自定义事件
    this.$on('el.form.addField', (field) => {
      if (field) {
        this.fields.push(field);
      }
    });
    /* istanbul ignore next */
    this.$on('el.form.removeField', (field) => {
      if (field.prop) {
        this.fields.splice(this.fields.indexOf(field), 1);
      }
    });
  },
  methods: {
    //对整个表单进行重置，将所有字段值重置为初始值并移除校验结果
    resetFields() {
      if (!this.model) {
        console.warn('[Element Warn][Form]model is required for resetFields to work.');
        return;
      }
      this.fields.forEach(field => {
        field.resetField();
      });
    },
    //移除表单项的校验结果。传入待移除的表单项的 prop 属性或者 prop 组成的数组，如不传则移除整个表单的校验结果
    clearValidate(props = []) {
      const fields = props.length
        ? (typeof props === 'string'
          ? this.fields.filter(field => props === field.prop)
          : this.fields.filter(field => props.indexOf(field.prop) > -1)
        ) : this.fields;
      fields.forEach(field => {
        field.clearValidate();
      });
    },
    //对整个表单进行校验的方法，参数为一个回调函数。该回调函数会在校验结束后被调用
    validate(callback) {
      //判断是否有表单数据对象，没有的话直接报错停止运行
      if (!this.model) {
        console.warn('[Element Warn][Form]model is required for validate to work!');
        return;
      }
      //声明一个promise，若不传入回调函数，则会返回promise
      let promise;
      // if no callback, return promise
      if (typeof callback !== 'function' && window.Promise) {
        promise = new window.Promise((resolve, reject) => {
          callback = function (valid, invalidFields) {
            valid ? resolve(valid) : reject(invalidFields);
          };
        });
      }

      let valid = true;
      let count = 0;
      // 如果需要验证的fields为空，调用验证时立刻返回callback
      if (this.fields.length === 0 && callback) {
        callback(true);
      }
      let invalidFields = {};
      this.fields.forEach(field => {
        field.validate('', (message, field) => {
          if (message) {
            valid = false;
          }
          invalidFields = objectAssign({}, invalidFields, field);
          if (typeof callback === 'function' && ++count === this.fields.length) {
            callback(valid, invalidFields);
          }
        });
      });

      if (promise) {
        return promise;
      }
    },
    //对部分表单字段进行校验的方法
    validateField(props, cb) {
      props = [].concat(props);
      const fields = this.fields.filter(field => props.indexOf(field.prop) !== -1);
      if (!fields.length) {
        console.warn('[Element Warn]please pass correct props!');
        return;
      }

      fields.forEach(field => {
        field.validate('', cb);
      });
    },
    getLabelWidthIndex(width) {
      const index = this.potentialLabelWidthArr.indexOf(width);
      // it's impossible
      if (index === -1) {
        throw new Error('[ElementForm]unpected width ', width);
      }
      return index;
    },
    registerLabelWidth(val, oldVal) {
      if (val && oldVal) {
        const index = this.getLabelWidthIndex(oldVal);
        this.potentialLabelWidthArr.splice(index, 1, val);
      } else if (val) {
        this.potentialLabelWidthArr.push(val);
      }
    },
    deregisterLabelWidth(val) {
      const index = this.getLabelWidthIndex(val);
      this.potentialLabelWidthArr.splice(index, 1);
    }
  }
};
</script>
