import Navbar from "./src/components/Navbar.js";
import Explorer from "./src/components/Explorer.js";
import Editor from "./src/components/Editor.js";
import Status from "./src/components/Status.js";

var app = new Vue({
  el: "#app",

  data() {
    return {
      socket: null,
      files: [{ name: "main.cpp", content: "" }],
      active: 0,
      mode: "text/x-c++src",
      //
      mirror: false,
      cursor: { ch: 0, line: 0 },
      //
      refresh: false,
    };
  },

  template: `
    <div>
        <Navbar :mirror="mirror" @toggle="mirror = !mirror"/>
        <div class="d-flex">
            <Explorer :files="files" @addFile="addFile" @removeFile="removeFile" @openFile="openFile" :active="active"/>
            <Editor :files="files" @openFile="openFile" :active="active" @edit="edit" :mode="mode" @cursor="setCursor" :refresh="refresh"/>
        </div>
        <Status :mode="mode" :active="active" :files="files" :cursor="cursor" @setFont="setFont"/>
    </div>
  `,
  /* SOCKET */
  created() {
    this.socket = io("https://code-blackboard.herokuapp.com/");
    // this.socket = io("http://localhost:3000/");

    this.socket.on("connect", () => {
      console.log(this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log(this.socket.id);
    });

    this.socket.on("broadcast", (arg) => {
      if (this.mirror) {
        this.active = arg.active;
        this.mode = arg.mode;
      }

      this.files = [...arg.files];
    });
  },

  mounted() {
    this.setMode();
  },

  methods: {
    addFile({ name, content }) {
      this.files = [...this.files, { name: name, content: content }];
      /* SOCKET */
      this.emit();
    },

    removeFile(payload) {
      this.files.splice(payload, 1);
      /* SOCKET */
      this.emit();
    },

    openFile(payload) {
      this.active = payload;
      this.setMode();
      /* SOCKET */
      this.emit();
    },

    edit(payload) {
      this.files[this.active].content = payload;
      /* SOCKET */
      this.emit();
    },

    setMode() {
      let filename = this.files[this.active].name;
      if (filename.includes(".")) {
        filename = this.files[this.active].name.split(".");
        if (filename.length >= 2) {
          let ext = filename.pop();

          switch (ext) {
            case "c":
            case "cpp":
            case "java":
              this.mode = "text/x-c++src";
              break;

            case "py":
              this.mode = "python";
              break;

            case "xml":
            case "html":
            case "htm":
              this.mode = "xml";
              break;

            case "js":
              this.mode = "javascript";
              break;

            default:
              this.mode = "text/x-c++src";
              break;
          }
        }
      }
    },

    setCursor(payload) {
      this.cursor = { ...payload };
    },

    emit() {
      this.socket.emit("emit", {
        files: this.files,
        active: this.active,
        mode: this.mode,
        cursor: this.cursor,
      });
    },

    setFont() {
      this.refresh = !this.refresh;
    },
  },

  components: {
    Navbar,
    Explorer,
    Editor,
    Status,
  },
});
