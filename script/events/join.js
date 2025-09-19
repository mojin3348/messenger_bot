const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

try {
	Canvas.registerFont(path.join(__dirname, "fonts", "Poppins-Bold.ttf"), { family: "PoppinsBold" });
	Canvas.registerFont(path.join(__dirname, "fonts", "Poppins-Regular.ttf"), { family: "Poppins" });
	Canvas.registerFont(path.join(__dirname, "fonts", "Orbitron-Bold.ttf"), { family: "Orbitron" });
} catch (e) {
	console.log("⚠️ Fonts not found, defaulting to Sans");
}

module.exports.config = {
	name: "join",
	eventType: ["log:subscribe"],
	version: "2.2.0",
	credits: "ryuko + chatgpt",
	description: "join and welcome notification with cyan canvas card",
	dependencies: {
		"fs-extra": "",
		"axios": "",
		"canvas": ""
	}
};

module.exports.run = async function({ api, event, Threads, botname, prefix }) {
	const { threadID } = event;
	const data = (await Threads.getData(event.threadID)).data || {};
	const checkban = data.banOut || [];
	const botID = await api.getCurrentUserID();

	if (checkban.includes(checkban[0])) return;

	if (event.logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
		api.changeNickname(`${botname} ✨`, threadID, botID);
		return api.sendMessage(
			`🤖 Connected successfully!\n\n` +
			`🔹 Bot Name: ${botname}\n` +
			`🔹 Prefix: ${prefix}\n\n` +
			`📊 Data:\n👥 Users: ${global.data.allUserID.length}\n💬 Groups: ${global.data.allThreadID.get(botID).length}\n\n` +
			`💡 How to use:\n${prefix}help → command list\nai [ prompt ] → no prefix\ntalk [ text ] → no prefix\n\n🚀 Autobot is ready!`,
			threadID
		);
	} else {
		try {
			const { threadName, participantIDs } = await api.getThreadInfo(threadID);
			const threadData = global.data.threadData.get(parseInt(threadID)) || {};

			for (let user of event.logMessageData.addedParticipants) {
				try {
					const avatar = await axios.get(
						`https://graph.facebook.com/${user.userFbId}/picture?width=512&height=512`,
						{ responseType: "arraybuffer" }
					);

					const canvas = Canvas.createCanvas(1000, 400);
					const ctx = canvas.getContext("2d");
          
					const gradient = ctx.createLinearGradient(0, 0, 1000, 400);
					gradient.addColorStop(0, "#001f2d");
					gradient.addColorStop(0.5, "#003b4d");
					gradient.addColorStop(1, "#005b73");
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, canvas.width, canvas.height);

					for (let i = 0; i < 80; i++) {
						const x = Math.random() * canvas.width;
						const y = Math.random() * canvas.height;
						const radius = Math.random() * 3;
						ctx.beginPath();
						ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()})`;
						ctx.shadowColor = "#00ffff";
						ctx.shadowBlur = 20;
						ctx.arc(x, y, radius, 0, Math.PI * 2);
						ctx.fill();
						ctx.shadowBlur = 0;
					}

					ctx.lineWidth = 0.5;
					ctx.strokeStyle = "rgba(0,255,255,0.08)";
					for (let i = 0; i < canvas.width; i += 40) {
						ctx.beginPath();
						ctx.moveTo(i, 0);
						ctx.lineTo(i, canvas.height);
						ctx.stroke();
					}
					for (let j = 0; j < canvas.height; j += 40) {
						ctx.beginPath();
						ctx.moveTo(0, j);
						ctx.lineTo(canvas.width, j);
						ctx.stroke();
					}

					const avatarImg = await Canvas.loadImage(avatar.data);
					ctx.save();
					ctx.beginPath();
					ctx.arc(200, 200, 120, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(avatarImg, 80, 80, 240, 240);
					ctx.restore();

					ctx.beginPath();
					ctx.arc(200, 200, 122, 0, Math.PI * 2);
					ctx.strokeStyle = "#00ffff";
					ctx.lineWidth = 6;
					ctx.shadowColor = "#00ffff";
					ctx.shadowBlur = 25;
					ctx.stroke();
					ctx.shadowBlur = 0;

					ctx.fillStyle = "#ffffff";
					ctx.font = "bold 45px PoppinsBold, Sans";
					ctx.fillText("✨ Welcome to the Group ✨", 370, 140);

					ctx.font = "bold 60px Orbitron, Sans";
					ctx.fillStyle = "#00ffff";
					ctx.shadowColor = "#00ffff";
					ctx.shadowBlur = 20;
					ctx.fillText(user.fullName, 370, 230);
					ctx.shadowBlur = 0;

					ctx.font = "28px Poppins, Sans";
					ctx.fillStyle = "#aeefff";
					ctx.fillText(`Group: ${threadName}`, 370, 290);

					ctx.font = "28px Poppins, Sans";
					ctx.fillStyle = "#aeefff";
					ctx.fillText(`Members: ${participantIDs.length}`, 370, 330);

					ctx.beginPath();
					ctx.moveTo(350, 350);
					ctx.lineTo(950, 350);
					ctx.strokeStyle = "#00ffff";
					ctx.lineWidth = 3;
					ctx.shadowColor = "#00ffff";
					ctx.shadowBlur = 15;
					ctx.stroke();
					ctx.shadowBlur = 0;

					const imgPath = path.join(__dirname, `cache/welcome_${user.userFbId}.png`);
					fs.writeFileSync(imgPath, canvas.toBuffer());

					let msg = threadData.customJoin || 
					`💎 Welcome {name}! 💎\n\n` +
					`👋 Hello {type}, thank you for joining to [ {threadName} ]\n` +
					`🌊 You are now part of our family. Enjoy and have fun!\n\n` +
					`📌 Member Count: {soThanhVien}`;

					msg = msg
						.replace(/\{name}/g, user.fullName)
						.replace(/\{type}/g, "you")
						.replace(/\{soThanhVien}/g, participantIDs.length)
						.replace(/\{threadName}/g, threadName);

					api.sendMessage(
						{
							body: msg,
							attachment: fs.createReadStream(imgPath)
						},
						threadID,
						() => fs.unlinkSync(imgPath)
					);

				} catch (err) {
					console.error("❌ Error creating cyan welcome card:", err);
				}
			}
		} catch (e) { 
			return console.log(e); 
		}
	}
};
