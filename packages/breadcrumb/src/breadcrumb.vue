<template>
  <div class="el-breadcrumb" aria-label="Breadcrumb" role="navigation">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'ElBreadcrumb',

  props: {
    separator: {//分隔符
      type: String,
      default: '/'
    },
    separatorClass: {//图标分隔符 class
      type: String,
      default: ''
    }
  },
  //看不懂给老子百度草了都
  provide() {
    return {
      elBreadcrumb: this
    };
  },

  mounted() {
    const items = this.$el.querySelectorAll('.el-breadcrumb__item');
    if (items.length) {
      items[items.length - 1].setAttribute('aria-current', 'page');
    }
  }
};
</script>
