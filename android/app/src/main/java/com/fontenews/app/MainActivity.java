package com.fontenews.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import android.graphics.Color;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Ensure content fits within system bars (status & navigation)
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

    // Give system bars their own background so they are visually separate from the app
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
      getWindow().setStatusBarColor(Color.BLACK);
      getWindow().setNavigationBarColor(Color.BLACK);
    }
  }
}
