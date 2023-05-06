<template>
  <div class="el-form-item" :class="[{
    'el-form-item--feedback': elForm && elForm.statusIcon,
    'is-error': validateState === 'error',
    'is-validating': validateState === 'validating',
    'is-success': validateState === 'success',
    'is-required': isRequired || required,
    'is-no-asterisk': elForm && elForm.hideRequiredAsterisk
  },
  sizeClass ? 'el-form-item--' + sizeClass : ''
  ]">
    <label-wrap :is-auto-width="labelStyle && labelStyle.width === 'auto'" :update-all="form.labelWidth === 'auto'">
      <label :for="labelFor" class="el-form-item__label" :style="labelStyle" v-if="label || $slots.label">
        <slot name="label">{{ label + form.labelSuffix }}</slot>
      </label>
    </label-wrap>
    <div class="el-form-item__content" :style="contentStyle">
      <slot></slot>
      <transition name="el-zoom-in-top">
        <slot v-if="validateState === 'error' && showMessage && form.showMessage" name="error" :error="validateMessage">
          <div class="el-form-item__error" :class="{
              'el-form-item__error--inline': typeof inlineMessage === 'boolean'
                ? inlineMessage
                : (elForm && elForm.inlineMessage || false)
            }">
            {{ validateMessage }}
          </div>
        </slot>
      </transition>
    </div>
  </div>
</template>
<script>
import AsyncValidator from 'async-validator';
import emitter from 'element-ui/src/mixins/emitter';//组件下发与向上传递方法
import objectAssign from 'element-ui/src/utils/merge';//di
import { noop, getPropByPath } from 'element-ui/src/utils/util';
import LabelWrap from './label-wrap';
export default {
  name: 'ElFormItem',

  componentName: 'ElFormItem',

  mixins: [emitter],
  //把当前vue对象向下传入子孙组件
  provide() {
    return {
      elFormItem: this
    };
  },
  //接受form向下传入的vue对象
  inject: ['elForm'],

  props: {
    label: String,//标签文本
    labelWidth: String,//表单域标签的的宽度
    prop: String,//表单域 model 字段，在使用 validate、resetFields 方法的情况下，该属性是必填的
    required: {//是否必填，如不设置，则会根据校验规则自动生成
      type: Boolean,
      default: undefined
    },
    rules: [Object, Array],//表单验证规则
    error: String,//表单域验证错误信息, 设置该值会使表单验证状态变为error，并显示该错误信息
    validateStatus: String,//表单验证结果
    for: String,//label标签上的for元素
    inlineMessage: {//以行内形式展示校验信息
      type: [String, Boolean],
      default: ''
    },
    showMessage: {//是否显示校验错误信息
      type: Boolean,
      default: true
    },
    size: String//用于控制该表单域下组件的尺寸
  },
  components: {
    // use this component to calculate auto width
    LabelWrap
  },
  watch: {
    //监听props传入的error信息
    error: {
      immediate: true,
      handler(value) {
        //赋值给validateMessage
        this.validateMessage = value;
        //根据error改变validateState状态
        this.validateState = value ? 'error' : '';
      }
    },
    //父组件传入的验证状态赋值给validateState
    validateStatus(value) {
      this.validateState = value;
    },
    //监听直接传入的rules
    rules(value) {
      //如果传入的值为空的或长度为0且required（是否必填）也为undefined则清除表单
      if ((!value || value.length === 0) && this.required === undefined) {
        this.clearValidate();
      }
    }
  },
  computed: {
    labelFor() {
      return this.for || this.prop;
    },
    labelStyle() {
      const ret = {};
      if (this.form.labelPosition === 'top') return ret;
      const labelWidth = this.labelWidth || this.form.labelWidth;
      if (labelWidth) {
        ret.width = labelWidth;
      }
      return ret;
    },
    contentStyle() {
      const ret = {};
      const label = this.label;
      if (this.form.labelPosition === 'top' || this.form.inline) return ret;
      if (!label && !this.labelWidth && this.isNested) return ret;
      const labelWidth = this.labelWidth || this.form.labelWidth;
      if (labelWidth === 'auto') {
        if (this.labelWidth === 'auto') {
          ret.marginLeft = this.computedLabelWidth;
        } else if (this.form.labelWidth === 'auto') {
          ret.marginLeft = this.elForm.autoLabelWidth;
        }
      } else {
        ret.marginLeft = labelWidth;
      }
      return ret;
    },
    form() {
      let parent = this.$parent;
      let parentName = parent.$options.componentName;
      while (parentName !== 'ElForm') {
        if (parentName === 'ElFormItem') {
          this.isNested = true;
        }
        parent = parent.$parent;
        parentName = parent.$options.componentName;
      }
      return parent;
    },
    fieldValue() {
      const model = this.form.model;
      if (!model || !this.prop) { return; }

      let path = this.prop;
      if (path.indexOf(':') !== -1) {
        path = path.replace(/:/, '.');
      }

      return getPropByPath(model, path, true).v;
    },
    isRequired() {
      let rules = this.getRules();
      let isRequired = false;

      if (rules && rules.length) {
        rules.every(rule => {
          if (rule.required) {
            isRequired = true;
            return false;
          }
          return true;
        });
      }
      return isRequired;
    },
    _formSize() {
      return this.elForm.size;
    },
    elFormItemSize() {
      return this.size || this._formSize;
    },
    sizeClass() {
      return this.elFormItemSize || (this.$ELEMENT || {}).size;
    }
  },
  data() {
    return {
      //验证结果类型
      validateState: '',
      //验证结果显示的错误信息
      validateMessage: '',

      validateDisabled: false,
      validator: {},
      isNested: false,
      computedLabelWidth: ''
    };
  },
  methods: {
    validate(trigger, callback = noop) {
      this.validateDisabled = false;
      const rules = this.getFilteredRule(trigger);
      if ((!rules || rules.length === 0) && this.required === undefined) {
        callback();
        return true;
      }

      this.validateState = 'validating';

      const descriptor = {};
      if (rules && rules.length > 0) {
        rules.forEach(rule => {
          delete rule.trigger;
        });
      }
      descriptor[this.prop] = rules;

      const validator = new AsyncValidator(descriptor);
      const model = {};

      model[this.prop] = this.fieldValue;

      validator.validate(model, { firstFields: true }, (errors, invalidFields) => {
        this.validateState = !errors ? 'success' : 'error';
        this.validateMessage = errors ? errors[0].message : '';

        callback(this.validateMessage, invalidFields);
        this.elForm && this.elForm.$emit('validate', this.prop, !errors, this.validateMessage || null);
      });
    },
    //移除该表单项的校验结果
    clearValidate() {
      this.validateState = '';
      this.validateMessage = '';
      this.validateDisabled = false;
    },
    //对该表单项进行重置，将其值重置为初始值并移除校验结果
    resetField() {
      this.validateState = '';
      this.validateMessage = '';

      let model = this.form.model;
      let value = this.fieldValue;
      let path = this.prop;
      if (path.indexOf(':') !== -1) {
        path = path.replace(/:/, '.');
      }

      let prop = getPropByPath(model, path, true);

      this.validateDisabled = true;
      if (Array.isArray(value)) {
        prop.o[prop.k] = [].concat(this.initialValue);
      } else {
        prop.o[prop.k] = this.initialValue;
      }

      // reset validateDisabled after onFieldChange triggered
      this.$nextTick(() => {
        this.validateDisabled = false;
      });

      this.broadcast('ElTimeSelect', 'fieldReset', this.initialValue);
    },
    getRules() {
      let formRules = this.form.rules;
      const selfRules = this.rules;
      const requiredRule = this.required !== undefined ? { required: !!this.required } : [];

      const prop = getPropByPath(formRules, this.prop || '');
      formRules = formRules ? (prop.o[this.prop || ''] || prop.v) : [];

      return [].concat(selfRules || formRules || []).concat(requiredRule);
    },
    getFilteredRule(trigger) {
      const rules = this.getRules();

      return rules.filter(rule => {
        if (!rule.trigger || trigger === '') return true;
        if (Array.isArray(rule.trigger)) {
          return rule.trigger.indexOf(trigger) > -1;
        } else {
          return rule.trigger === trigger;
        }
      }).map(rule => objectAssign({}, rule));
    },
    onFieldBlur() {
      this.validate('blur');
    },
    onFieldChange() {
      if (this.validateDisabled) {
        this.validateDisabled = false;
        return;
      }

      this.validate('change');
    },
    updateComputedLabelWidth(width) {
      this.computedLabelWidth = width ? `${width}px` : '';
    },
    addValidateEvents() {
      const rules = this.getRules();

      if (rules.length || this.required !== undefined) {
        this.$on('el.form.blur', this.onFieldBlur);
        this.$on('el.form.change', this.onFieldChange);
      }
    },
    removeValidateEvents() {
      this.$off();
    }
  },
  mounted() {
    if (this.prop) {
      this.dispatch('ElForm', 'el.form.addField', [this]);

      let initialValue = this.fieldValue;
      if (Array.isArray(initialValue)) {
        initialValue = [].concat(initialValue);
      }
      Object.defineProperty(this, 'initialValue', {
        value: initialValue
      });

      this.addValidateEvents();
    }
  },
  beforeDestroy() {
    this.dispatch('ElForm', 'el.form.removeField', [this]);
  }
};
</script>
