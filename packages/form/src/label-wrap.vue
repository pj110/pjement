<script>

export default {
  props: {
    isAutoWidth: Boolean,
    updateAll: Boolean
  },

  inject: ['elForm', 'elFormItem'],
  //jsx语法中不需要h，直接return()返回就完事儿了
  render() {
    //获取所有插槽
    const slots = this.$slots.default;
    //如果没有插槽直接返回null不渲染
    if (!slots) return null;
    //判断是否为自动宽度
    if (this.isAutoWidth) {
      //判断为真则创建带宽度的jsx并返回
      const autoLabelWidth = this.elForm.autoLabelWidth;
      const style = {};
      if (autoLabelWidth && autoLabelWidth !== 'auto') {
        const marginLeft = parseInt(autoLabelWidth, 10) - this.computedWidth;
        if (marginLeft) {
          style.marginLeft = marginLeft + 'px';
        }
      }
      return (<div class="el-form-item__label-wrap" style={style}>
        { slots }
      </div>);
    } else {
      //判断为假就直接返回插槽内容
      return slots[0];
    }
  },

  methods: {
    //获取label长度
    getLabelWidth() {
      if (this.$el && this.$el.firstElementChild) {
        //获取当前元素所有最终使用的width
        const computedWidth = window.getComputedStyle(this.$el.firstElementChild).width;// window.getComputedStyle是一个可以获取当前元素所有最终使用的CSS属性值
        //上舍入(转浮点数)
        return Math.ceil(parseFloat(computedWidth));
      } else {
        return 0;
      }
    },
    //更新label长度
    updateLabelWidth(action = 'update') {
      if (this.$slots.default && this.isAutoWidth && this.$el.firstElementChild) {
        if (action === 'update') {
          this.computedWidth = this.getLabelWidth();
        } else if (action === 'remove') {
          this.elForm.deregisterLabelWidth(this.computedWidth);
        }
      }
    }
  },
  //监听label组件长度
  watch: {
    computedWidth(val, oldVal) {
      if (this.updateAll) {
        this.elForm.registerLabelWidth(val, oldVal);
        this.elFormItem.updateComputedLabelWidth(val);
      }
    }
  },

  data() {
    return {
      computedWidth: 0
    };
  },

  mounted() {
    this.updateLabelWidth('update');
  },

  updated() {
    this.updateLabelWidth('update');
  },

  beforeDestroy() {
    this.updateLabelWidth('remove');
  }
};
</script>
