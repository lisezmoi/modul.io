//		Universal Openers		$(function(){		$('.open').click(function() {		  $(this).next(".inside").toggle(0, function() {			$(this).parent().toggleClass('closed');		  });		});		$('#myModul').click( function() {			$('#modulArea').toggle();			$('#modulInfo').toggle();		});	});$(document).ready(function() {	//		CSS SWITCH	$(".styleswitch").click(function() { 		$("#switch").attr("href", $(this).attr("href"));		 return false;	});		//       Keypress			$(window).keydown(function(e) {		if(e.keyCode==37){			$('.keyLeft').addClass("keyActive");		};		if(e.keyCode==38){			$('.keyTop').addClass("keyActive");		};		if(e.keyCode==39){			$('.keyRight').addClass("keyActive");		};		if(e.keyCode==40){			$('.keyBottom').addClass("keyActive");		};	});	   	$(window).keyup(function(f) {		if(f.keyCode==37){			$('.keyLeft').removeClass("keyActive");		};		if(f.keyCode==38){			$('.keyTop').removeClass("keyActive");		};		if(f.keyCode==39){			$('.keyRight').removeClass("keyActive");		};		if(f.keyCode==40){			$('.keyBottom').removeClass("keyActive");		};	});	   	});	   