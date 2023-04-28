<template>
  <div style="margin: 20px;">
    <el-input v-model="input" placeholder="请输入内容"></el-input>
    <el-scrollbar style="height: 200px;">
      <p v-for="item in 10">{{ item }}</p>
    </el-scrollbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      input: 'Hello Element UI!'
    };
  }
};
</script>
<style lang="scss">
.el-scrollbar__wrap {
  overflow-x: hidden !important;
}
</style>