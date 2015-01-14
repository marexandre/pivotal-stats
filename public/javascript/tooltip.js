$(function() {
  $(document)
    .on('mouseenter', '.task', function(e) {
      $(this).find('.tooltip')
        .css({
          top: e.pageY,
          left: e.pageX
        })
        .show();
    })
    .on('mouseleave', '.task', function(e) {
      $(this).find('.tooltip').hide();
    });
});
