(function(){
	"use strict";
	
	KC3StrategyTabs.pvp = new KC3StrategyTab("pvp");
	
	KC3StrategyTabs.pvp.definition = {
		tabSelf: KC3StrategyTabs.pvp,
		
		box_record: false,
		box_ship: false,
		
		exportingReplay: false,
		stegcover64: "",
		
		init :function(){},
		execute :function(){
			var self = this;
			// Count PvP records for pagination
			KC3Database.count_pvps(function(result){
				self.pages = Math.ceil( result / 10 );
				if(self.pages > 0){
					self.showPagination();
					self.showPage(1);
				} else {
					$(".tab_pvp .pagination").hide();
				}
			});
			// on-click for download replay button
			$("#pvp_list").on("click", ".pvp_dl", function(){
				self.downloadReplay($(this).data("id"));
			});
		},
		
		/* SHOW SPECIFIC PAGE
		---------------------------------*/
		showPage :function(pageNum){
			var self = this;
			$("#pvp_list").html("");
			KC3Database.get_pvps(pageNum, function(results){
				$.each(results, function(index, pvpBattle){
					self.cloneBattleBox(pvpBattle);
				});
			});
		},
		
		/* CLONE ONE BATTLE BOX RECORD
		---------------------------------*/
		cloneBattleBox :function(pvpBattle){
			var self = this;
			console.log(pvpBattle);
			
			self.box_record = $(".tab_pvp .factory .pvp_record").clone();
			
			// Basic battle info
			$(".pvp_id", self.box_record).text(pvpBattle.id);
			if (pvpBattle.time) {
				$(".pvp_date", self.box_record).text(new Date(pvpBattle.time*1000).format("mmm d"));
			} else {
				$(".pvp_date", self.box_record).text("unknown");
			}
			$(".pvp_result img", self.box_record).attr("src", "../../assets/img/client/ratings/"+pvpBattle.rating+".png");
			$(".pvp_dl", self.box_record).data("id", pvpBattle.id);
			
			// Player fleet
			$.each(pvpBattle.fleet, function(index, curShip){
				if (curShip == -1) return true;
				self.cloneShipBox(curShip, $(".pvp_player", self.box_record));
			});
			
			// Opponent Fleet
			$.each(pvpBattle.data.api_ship_ke, function(index, mstId){
				if (mstId == -1) return true;
				self.cloneShipBox({
					opponent: true,
					equip: pvpBattle.data.api_eSlot[index],
					kyouka: pvpBattle.data.api_eKyouka[index],
					hp: pvpBattle.data.api_maxhps[index+6],
					stats: pvpBattle.data.api_eParam[index],
					mst_id: mstId,
				}, $(".pvp_opponent", self.box_record));
			});
			
			self.box_record.appendTo("#pvp_list");
		},
		
		/* CLONE ONE SHIP BOX INTO BATTLE LIST
		---------------------------------*/
		cloneShipBox :function(data, targetBox){
			var self = this;
			this.box_ship = $(".tab_pvp .factory .pvp_details_ship").clone();
			
			$(".pvp_ship_icon img", this.box_ship).attr("src", KC3Meta.shipIcon(data.mst_id));
			$(".pvp_ship_icon", this.box_ship).addClass("simg-"+data.mst_id);
			$(".pvp_ship_name", this.box_ship).text(KC3Meta.shipName(KC3Master.ship(data.mst_id).api_name));
			
			if (!data.opponent) {
				$(".pvp_ship_level span", this.box_ship).text(data.level);
			} else {
				$(".pvp_ship_hp span", this.box_ship).text(data.hp);
				$(".pvp_ship_fp", this.box_ship).text(data.stats[0]);
				$(".pvp_ship_tp", this.box_ship).text(data.stats[1]);
				$(".pvp_ship_aa", this.box_ship).text(data.stats[2]);
				$(".pvp_ship_ar", this.box_ship).text(data.stats[3]);
			}
			
			var thisItem, divTag, imgTag;
			$.each(data.equip, function(index, itemMstId){
				if (itemMstId > 0) {
					var divTag = $("<div/>").addClass("pvp_ship_item");
					
					thisItem = KC3Master.slotitem(itemMstId);
					var imgTag = $("<img/>").attr("src", "../../assets/img/items/"+thisItem.api_type[3]+".png");
					divTag.append(imgTag).attr("title", KC3Meta.gearName(thisItem.api_name));
					
					$(".pvp_ship_items", self.box_ship).append(divTag);
				}
			});
			
			targetBox.append(this.box_ship);
		},
		
		/* PAGINATION
		---------------------------------*/
		showPagination :function(){
			var self = this;
			$(".tab_pvp .page_list").html('<ul class="pagination pagination-sm"></ul>');
			$(".tab_pvp .pagination").twbsPagination({
				totalPages: self.pages,
				visiblePages: 9,
				onPageClick: function (event, page) {
					self.showPage(page);
				}
			});
		},
		
		/* DOWNLOAD REPLAY
		---------------------------------*/
		downloadReplay :function(pvp_id){
			console.log(pvp_id);
			if(this.exportingReplay) return false;
			this.exportingReplay = true;
			
			var self = this;
			
			$("body").css("opacity", "0.5");
			
			if(this.stegcover64===""){
				this.stegcover64 = $.ajax({
					async: false,
					url: "../../../../assets/img/stegcover.b64"
				}).responseText;
			}
			
			var withDataCover64 = this.stegcover64;
			
			var rcanvas = document.createElement("canvas");
			rcanvas.width = 400;
			rcanvas.height = 400;
			var rcontext = rcanvas.getContext("2d");
			
			var domImg = new Image();
			domImg.onload = function(){
				rcontext.drawImage( domImg, 0, 0, 400, 400, 0, 0, 400, 400 );
				
				KC3Database.get_pvp_data( pvp_id, function(pvpData){
					console.log(pvpData);
					if (pvpData.length === 0) {
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return false;
					} else {
						pvpData = pvpData[0];
					}
					
					rcontext.font = "26pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText("PvP", 20, 215);
					
					rcontext.font = "20pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(PlayerManager.hq.name, 100, 210);
					
					var shipIconImage;
					$.each(pvpData.fleet, function(ShipIndex, ShipData){
						shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
						rcontext.drawImage(shipIconImage,0,0,70,70,25+(60*ShipIndex),233,50,50);
					});
					
					withDataCover64 = rcanvas.toDataURL("image/png");
					
					var encodeData = {
						battles: [
							{
								data: pvpData.data,
								yasen: pvpData.yasen
							}
						],
						combined: 0,
						diff: 0,
						fleet1: pvpData.fleet,
						fleet2: [],
						fleet3: [],
						fleet4: [],
						fleetnum: 1,
						hq: pvpData.hq,
						id: 0,
						support1: 0,
						support2: 0,
						world: 0,
						mapnum: 0,
					};
					
					var newImg = steganography.encode(JSON.stringify(encodeData), withDataCover64);
					
					chrome.downloads.download({
						url: newImg,
						filename: ConfigManager.ss_directory+'/replay/'+PlayerManager.hq.name+"_pvp_"+pvpData.id+'.png',
						conflictAction: "uniquify"
					}, function(downloadId){
						self.exportingReplay = false;
						$("body").css("opacity", "1");
					});
				});
				
			};
			domImg.src = this.stegcover64;
		}
	};
	
})();
