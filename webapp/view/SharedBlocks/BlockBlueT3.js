sap.ui.define(['sap/uxap/BlockBase'],
	function (BlockBase) {
		"use strict";

		var BlockBlueT3 = BlockBase.extend("com.pontual.sgmr.view.SharedBlocks.BlockBlueT3", {
			metadata: {
				views: {
					Collapsed: {
						viewName: "com.pontual.sgmr.view.SharedBlocks.BlockBlueT3",
						type: "XML"
					},
					Expanded: {
						viewName: "com.pontual.sgmr.view.SharedBlocks.BlockBlueT3",
						type: "XML"
					}
				}
			}
		});

		return BlockBlueT3;

	});