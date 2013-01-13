define(function(require, exports, module) {

    var $ = require('$');
    // ���ڱ�������޸ĵ�����ʽ
    var originStyles = {
        position: null,
        top: null
    };
    var ie6 = $.browser.msie && $.browser.version == 6.0;

    // Fixed
    // ---
    // ����������Ч����ģ��
    // element ����Ҫ���������Ŀ��Ԫ��
    // marginTop ָ��Ԫ�ؾ�����Ӵ��ڶ����ľ���������ֵʱ����ʼ�������� fixed ״̬
    var Fixed = function(element, marginTop) {

        // ׼��һЩ����Ԫ��
        element = $(element);
        marginTop = marginTop || 0;
        var doc = $(document);

        // һ��Ԫ��ָ�����һ��
        if (element.data('bind-fixed')) {
            return;
        }

        // ��¼Ԫ��ԭ����λ��
        var originTop = element.offset().top;
        // �������ߵ� marginTop
        marginTop = marginTop<=originTop ? marginTop : originTop;

        // ����ԭ�е���ʽ
        for (var style in originStyles) {
            if (originStyles.hasOwnProperty(style)) {
                originStyles[style] = element.css(style);
            }
        }
        
        var scrollFn = !ie6 ? function() {
            // ����Ԫ�ؾ��뵱ǰ�����Ϸ��ľ���
            var distance = originTop - doc.scrollTop();

            // ������С�ڵ���Ԥ���ֵʱ
            // ��Ԫ����Ϊ fix ״̬
            if (!element.data('_fixed') && distance <= marginTop) {
                element.css({
                    position: 'fixed',
                    top: marginTop
                });
                element.data('_fixed', true);
            } else if (element.data('_fixed') && distance > marginTop) {
                // �ָ�ԭ�е���ʽ
                element.css(originStyles);
                element.data('_fixed', false);
            }
        } : function() {
            // ����Ԫ�ؾ��뵱ǰ�����Ϸ��ľ���
            var distance = originTop - doc.scrollTop();

            // ������С�ڵ���Ԥ���ֵʱ
            // ��Ԫ����Ϊ fix ״̬
            if (distance <= marginTop) {
                element.css({
                    position: 'absolute',
                    top: marginTop + doc.scrollTop()
                });
                element.data('_fixed', true);
            } else if (element.data('_fixed') && distance > marginTop) {
                // �ָ�ԭ�е���ʽ
                element.css(originStyles);
                element.data('_fixed', false);
            }
        };

        // ������һ��
        scrollFn();
        // ���������¼�
        // fixed �Ǳ�ģ��󶨵Ĺ����¼��������ռ�
        doc.on('scroll', scrollFn);
        element.data('bind-fixed', true);
    };

    module.exports = Fixed;

});