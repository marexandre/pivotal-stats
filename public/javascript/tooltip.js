$(function() {
  'use strict';

  $(document)
    .on('mouseenter', '.task', function() {
      var $task = $(this);
      $task.find('.tooltip')
        .css({
          top: $task.position().top,
          left: $task.position().left + $task.width() - 2
        })
        .show();
    })
    .on('mouseleave', '.task', function() {
      $(this).find('.tooltip').hide();
    });
});
