<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { resetAdminWorkbenchSessionOnLaunch } from "./features/admin-workbench-auth/admin-workbench-entry";

onLaunch(() => {
  resetAdminWorkbenchSessionOnLaunch();
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
