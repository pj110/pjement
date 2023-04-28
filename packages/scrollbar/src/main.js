// reference https://github.com/noeldelgado/gemini-scrollbar/blob/master/index.js
//scrollbar 组件中嵌套 wrap和view 两层元素。wrap为滚动层，view为视图容器层。同时生成两种虚拟滚动条 horizontal 和 vertical
import { addResizeListener, removeResizeListener } from 'element-ui/src/utils/resize-event';
import scrollbarWidth from 'element-ui/src/utils/scrollbar-width';//获取滑动条的宽度
import { toObject } from 'element-ui/src/utils/util';
import Bar from './bar';

/* istanbul ignore next */
export default {
  name: 'ElScrollbar',

  components: { Bar },

  props: {
    native: Boolean,//是否使用原生滚动条，既不生成自定义虚拟滚动条
    wrapStyle: {}, // wrap的内联样式,支持数组和字符串两种格式,
    wrapClass: {},//自定义wrap的类名
    viewClass: {},//自定义view的类名
    viewStyle: {},//view的内联样式,支持数组和字符串两种格式,可选参数
    noresize: Boolean, // 如果 container 尺寸不会发生变化，最好设置它可以优化性能
    tag: {//最外层的组件包裹标签，默认为div
      type: String,
      default: 'div'
    }
  },

  data() {
    return {
      sizeWidth: '0',//水平滚动条的宽度
      sizeHeight: '0',//垂直滚动条的宽度
      moveX: 0,//水平滚动条的移动比例
      moveY: 0//垂直滚动条的移动比例
    };
  },

  computed: {
    wrap() {
      return this.$refs.wrap;
    }
  },
  //不适用模板，采用render渲染函数
  render(h) {
    let gutter = scrollbarWidth();//获取滑动条的宽度
    let style = this.wrapStyle;


    if (gutter) {//判断是否获取到滑动条的宽度
      //将利用`-${gutter}px`将原生滑动条隐藏起来
      const gutterWith = `-${gutter}px`;
      const gutterStyle = `margin-bottom: ${gutterWith}; margin-right: ${gutterWith};`;
      //这个if判断就是为了吧`-${gutter}px`添加到style中去，从而达到隐藏原生滑动条的目的
      if (Array.isArray(this.wrapStyle)) {//判断this.wrapStyle是否为数组
        //为数组的话则使用toObject方法将传入的style数组转换为对象将gutterWith赋值到marginRight与marginBottom中隐藏原生的滑动条
        style = toObject(this.wrapStyle);
        style.marginRight = style.marginBottom = gutterWith;
      } else if (typeof this.wrapStyle === 'string') {//判断this.wrapStyle是否为字符串
        style += gutterStyle;
      } else {
        style = gutterStyle;
      }
    }
    //渲染方法
    //h(a,b,c)
    // {String | Object | Function}
    // 一个 HTML 标签名、组件选项对象，或者
    // resolve 了上述任何一种的一个 async 函数。必填项。
    //====
    // {Object}
    // 一个与模板中 attribute 对应的数据对象。可选。
    //====
    // {String | Array}
    // 子级虚拟节点 (VNodes)，由 `createElement()` 构建而成，
    // 也可以使用字符串来生成“文本虚拟节点”。可选。
    const view = h(this.tag,//为包含在外的标签
      {
        class: ['el-scrollbar__view', this.viewClass],//添加class类
        style: this.viewStyle,//添加传入的
        ref: 'resize'
      },
      this.$slots.default
    );
    //jsx方式渲染标签，将传入的元素元素转换为jsx元素并添加到页面上
    const wrap = (//滚动层
      <div
        ref="wrap"
        style={style}
        onScroll={this.handleScroll}
        class={[this.wrapClass, 'el-scrollbar__wrap', gutter ? '' : 'el-scrollbar__wrap--hidden-default']}>
        {[view]}
      </div>
    );
    let nodes;
    //判断是否使用原生滑动条
    if (!this.native) {//不适用原生滑动条Bar为滑动条组件
      nodes = ([
        wrap,
        <Bar
          move={this.moveX}
          size={this.sizeWidth}></Bar>,
        <Bar
          vertical
          move={this.moveY}
          size={this.sizeHeight}></Bar>
      ]);
    } else {//使用滑动条组件
      nodes = ([
        <div
          ref="wrap"
          class={[this.wrapClass, 'el-scrollbar__wrap']}
          style={style}>
          {[view]}
        </div>
      ]);
    }
    return h('div', { class: 'el-scrollbar' }, nodes);
  },

  methods: {
    /**
     * 当元素滚动时，计算出水平和垂直方向滚动条的位移translateX和translateY
     * 1、视图clientHeight与scrollHeight的比例 = 虚拟滚动条thumb与滑轨bar的比例
     * 2、所以当视图滚动时，scrollTop与clientHeight的比例 = moveY与虚拟滚动条thumb的比例 = 滚动条thumb的translateY
     * 3、假如scrollTop和clientHeight都为100px,此时滚动条thumb的translateY = 100%
     * 注意：translateY和translateX距离都是基于自身宽高设置的
     * */
    handleScroll() {
      const wrap = this.wrap;
      this.moveY = ((wrap.scrollTop * 100) / wrap.clientHeight);
      this.moveX = ((wrap.scrollLeft * 100) / wrap.clientWidth);
    },
    /**
     * update方法用来计算滑块el-scrollbar__thumb的高度
     * 1、得到el-scrollbar__wrap容器的clientHeight/scrollHeight的比例
     * 2、视图clientHeight与scrollHeight的比例 = 虚拟滚动条thumb与滑轨bar的比例
     * 3、利用css百分比设置样式，当bar为父元素时，滑块thumb的高度为： heightPercentage + '%'
     * */

    update() {
      let heightPercentage, widthPercentage;
      const wrap = this.wrap;
      if (!wrap) return;

      heightPercentage = (wrap.clientHeight * 100 / wrap.scrollHeight);
      widthPercentage = (wrap.clientWidth * 100 / wrap.scrollWidth);

      this.sizeHeight = (heightPercentage < 100) ? (heightPercentage + '%') : '';
      this.sizeWidth = (widthPercentage < 100) ? (widthPercentage + '%') : '';
    }
  },

  mounted() {
    if (this.native) return;
    // 初始化时计算一次滑块的高度
    this.$nextTick(this.update);
    // 当容器的尺寸发生变化时，重新计算滑块的高度
    !this.noresize && addResizeListener(this.$refs.resize, this.update);
  },

  beforeDestroy() {
    if (this.native) return;
    !this.noresize && removeResizeListener(this.$refs.resize, this.update);
  }
};
