$(document).ready(function(e) {
    var menu = $('#gogo');
    var contents = $('#s2');

    menu.click(function(event){
        event.preventDefault();

        var tg = $(this);
        var i = tg.index();

        var section = contents.eq(i);
        var tt = section.offset().top;

        $('html, body').stop().animate({scrollTop:tt});
    });
});