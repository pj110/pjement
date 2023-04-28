import Vue from 'vue';

let scrollBarWidth;

export default function () {
  //判断是否为服务器渲染
  if (Vue.prototype.$isServer) return 0;
  //如果是第一次引入这个方法的话就往下走，如果不是的话就直接返回scroBarWidth  
  if (scrollBarWidth !== undefined) return scrollBarWidth;
  //创建一div的dom
  const outer = document.createElement('div');
  //给div添加一个class属性
  outer.className = 'el-scrollbar__wrap';
  //给div添加一个csss属性设施为不可见
  outer.style.visibility = 'hidden';
  //设置div的宽度
  outer.style.width = '100px';
  //设置div为绝对定位，移出文档流
  outer.style.position = 'absolute';
  //将div移出屏幕之外
  outer.style.top = '-9999px';
  //将div插入到body元素中
  document.body.appendChild(outer);
  //获取div的长度(offsetWidth属性可以返回对象的padding+border+width属性值之和)
  const widthNoScroll = outer.offsetWidth;
  //添加css
  outer.style.overflow = 'scroll';
  //创建一个div
  const inner = document.createElement('div');
  //新的div宽度为100%
  inner.style.width = '100%';
  //将新的div添加到之前的div中
  outer.appendChild(inner);
  //获取新的div的长度
  const widthWithScroll = inner.offsetWidth;
  //删除之前创建的div
  outer.parentNode.removeChild(outer);
  //用父div的宽度减去子div的宽度得到滑动条的长度
  scrollBarWidth = widthNoScroll - widthWithScroll;
  //返回长度
  return scrollBarWidth;
};
